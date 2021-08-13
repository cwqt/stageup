import idFinderStrategies from '@backend/common/authorisation/id-finder-strategies';
import { getCheck } from '@backend/common/error';
import { BackendProviderMap } from '@backend/common/providers';
import {
  BaseController,
  Host,
  IControllerEndpoint,
  PatronSubscription,
  PaymentMethod,
  transact,
  User,
  Validators
} from '@core/api';
import { to, uuid } from '@core/helpers';
import {
  DtoCreatePaymentIntent,
  DtoUpdatePatronTier,
  HostPermission,
  IHostPatronTier,
  IPatronSubscription,
  IPatronTier,
  IStripeChargePassthrough,
  PurchaseableType
} from '@core/interfaces';
import { PatronTier } from 'libs/shared/src/api/entities/hosts/patron-tier.entity';
import AuthStrat from '../common/authorisation';

// Stripe Connected Subscriptions --------------------------------------------------------------
// https://stripe.com/img/docs/subscriptions/invoice-lifecycle-incomplete-incomplete_expired.svg

export default class PatronageController extends BaseController<BackendProviderMap> {
  createPatronTier(): IControllerEndpoint<IHostPatronTier> {
    return {
      // validators: { body: Validators.Objects.DtoCreatePatronTier },
      authorisation: AuthStrat.hasHostPermission(HostPermission.Admin),
      controller: async req => {
        // Direct Charges https://stripe.com/img/docs/billing/subscriptions/subscription_objects_fixed_price.svg
        const host = await getCheck(Host.findOne({ _id: req.params.hid }));

        const tier = await this.ORM.transaction(async txc => {
          const tier = new PatronTier(req.body, host);
          return await tier.setup(this.providers.stripe.connection, txc);
        });

        return tier.toHost();
      }
    };
  }

  readPatronTiers(): IControllerEndpoint<Array<IHostPatronTier | IPatronTier>> {
    return {
      authorisation: AuthStrat.none,
      controller: async req => {
        const host = await getCheck(Host.findOne({ _id: req.params.hid }, { relations: ['patron_tiers'] }));
        const [isMemberOfHost] = await AuthStrat.hasHostPermission(HostPermission.Admin, () => host._id)(
          req,
          this.providers
        );

        return isMemberOfHost
          ? host.patron_tiers.map(t => t.toHost())
          : host.patron_tiers.filter(t => t.is_visible).map(t => t.toFull());
      }
    };
  }

  updatePatronTier(): IControllerEndpoint<IHostPatronTier> {
    return {
      validators: { body: Validators.Objects.DtoUpdatePatronTier },
      authorisation: AuthStrat.runner(
        { hid: idFinderStrategies.findHostIdFromPatronTierId },
        AuthStrat.hasHostPermission(HostPermission.Editor, m => m.hid)
      ),
      controller: async req => {
        const update: DtoUpdatePatronTier = req.body;
        const oldTier = await getCheck(
          PatronTier.findOne({ where: { _id: req.params.tid }, relations: { host: true } })
        );

        if (oldTier.amount !== update.amount) {
          try {
            const newTier = await transact(async txc => {
              // If Prices change things get more complex because of Stripe intentionally making them immutable
              // so we create a completely new tier with a new Price & move all existing subscribers over to the new tiers' Price
              // https://stripe.com/docs/billing/subscriptions/upgrade-downgrade
              const newTier = new PatronTier(
                {
                  name: update.name,
                  description: update.description,
                  currency: oldTier.currency,
                  amount: update.amount
                },
                oldTier.host
              );

              newTier.total_patrons = oldTier.total_patrons;
              newTier.is_visible = oldTier.is_visible;
              newTier.version = oldTier.version + 1;

              // Keep the same product_id, just changing the Price
              newTier.stripe_product_id = oldTier.stripe_product_id;
              await newTier.createStripePrice(this.providers.stripe.connection);

              // Soft remove the old tier for invoicing purposes & set old Price to in-active
              await txc.softRemove(oldTier);
              await this.providers.stripe.connection.prices.update(
                oldTier.stripe_price_id,
                { active: false },
                { stripeAccount: oldTier.host.stripe_account_id }
              );

              // Save new tier
              await txc.save(newTier);
              return newTier.toHost();
            });

            // Commit the transaction _then_ publish the event
            // This event will shift all exisiting subscribers over by updating the price
            await this.providers.bus.publish(
              'patronage.tier_amount_changed',
              { old_tier_id: oldTier._id, new_tier_id: newTier._id },
              req.locale
            );

            return newTier;
          } catch (error) {}
        } else {
          // Updating non-important fields doesn't warrant a complete clone
          oldTier.name = update.name;
          oldTier.description = update.description;
          oldTier.is_visible = update.is_visible;
          await oldTier.save();
          return oldTier.toHost();
        }
      }
    };
  }

  deletePatronTier(): IControllerEndpoint<void> {
    return {
      authorisation: AuthStrat.runner(
        { hid: idFinderStrategies.findHostIdFromPatronTierId },
        AuthStrat.hasHostPermission(HostPermission.Admin, m => m.hid)
      ),
      controller: async req => {
        const tier = await getCheck(PatronTier.findOne({ _id: req.params.tid }, { relations: { host: true } }));

        // Keep it around for invoicing purposes
        await tier.softRemove();
        // Cannot remove Stripe products if they have associated Prices, so set it to in-active
        await this.providers.stripe.connection.products.update(
          tier.stripe_product_id,
          { active: false },
          { stripeAccount: tier.host.stripe_account_id }
        );
        await this.providers.bus.publish('patronage.tier_deleted', { tier_id: tier._id }, req.locale);
      }
    };
  }

  unsubscribe(): IControllerEndpoint<void> {
    return {
      authorisation: AuthStrat.isLoggedIn,
      controller: async req => {}
    };
  }

  subscribe(): IControllerEndpoint<IPatronSubscription> {
    return {
      authorisation: AuthStrat.isLoggedIn,
      validators: { body: Validators.Objects.DtoCreatePaymentIntent },
      controller: async req => {
        const body: DtoCreatePaymentIntent<PurchaseableType.PatronTier> = req.body;
        const user = await getCheck(User.findOne({ _id: req.session.user._id }));
        const tier = await getCheck(
          PatronTier.findOne({
            where: {
              _id: req.params.tid
            },
            relations: ['host']
          })
        );

        // Create _id now so that we can reference it in the subscription passthrough data
        const patronSubscriptionId = uuid();

        // Stripe uses a PaymentIntent object to represent the **intent** to collect payment from a customer,
        // tracking charge attempts and payment state changes throughout the process.
        // Find (& check) the PaymentMethod that belongs to the logged-in user making the PaymentIntent
        const platformPaymentMethod = await getCheck(
          PaymentMethod.findOne({
            relations: ['user'],
            where: {
              _id: body.payment_method_id,
              user: {
                _id: req.session.user._id
              }
            }
          })
        );

        // Clone the PaymentMethod & Customer to the hosts Connect account - then attach them
        const method = await this.providers.stripe.connection.paymentMethods.create(
          {
            customer: platformPaymentMethod.user.stripe_customer_id,
            payment_method: platformPaymentMethod.stripe_method_id
          },
          { stripeAccount: tier.host.stripe_account_id }
        );

        const copiedCustomer = await this.providers.stripe.connection.customers.create(
          {
            email: user.email_address,
            name: `StageUp@${user.username}`,
            description: user._id
          },
          {
            stripeAccount: tier.host.stripe_account_id
          }
        );

        await this.providers.stripe.connection.paymentMethods.attach(
          method.id,
          { customer: copiedCustomer.id },
          { stripeAccount: tier.host.stripe_account_id }
        );

        // https://stripe.com/docs/connect/subscriptions#direct
        // Now we create a subscription on behalf of the hosts' Connected account, for the Product that was created on there
        const stripeSubscription = await this.providers.stripe.connection.subscriptions.create(
          {
            customer: copiedCustomer.id, // the customer we just cloned
            default_payment_method: method.id, // the method we just cloned
            metadata: to<IStripeChargePassthrough>({
              // Passed through to webhook when charge successful
              user_id: platformPaymentMethod.user._id,
              purchaseable_id: tier._id,
              purchaseable_type: PurchaseableType.PatronTier,
              payment_method_id: platformPaymentMethod._id
            }),
            items: [{ price: tier.stripe_price_id }],
            application_fee_percent: 0, // IMPORTANT: may require changes at some point when Drake changes his mind
            expand: ['latest_invoice.payment_intent']
          },
          // ...For this to work, both the customer and the price must be defined on the _connected account_.
          { stripeAccount: tier.host.stripe_account_id }
        );

        const patronSubscription = await this.ORM.transaction(async txc => {
          const sub = new PatronSubscription(stripeSubscription, user, tier, tier.host);
          sub._id = patronSubscriptionId;
          await txc.save(sub);

          tier.total_patrons += 1;
          await txc.save(tier);
          return sub;
        });

        this.providers.bus.publish('patronage.started', { user_id: user._id, tier_id: tier._id }, req.locale);
        return patronSubscription.toFull();
      }
    };
  }
}
