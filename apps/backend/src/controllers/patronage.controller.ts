import {
  BaseController,
  getCheck,
  Host,
  IControllerEndpoint,
  PatronSubscription,
  PaymentMethod,
  User,
  Validators
} from '@core/api';
import { to, uuid } from '@core/helpers';
import {
  DtoCreatePaymentIntent,
  HostPermission,
  IHostPatronTier,
  IPatronSubscription,
  IPatronTier,
  IStripeChargePassthrough,
  PurchaseableType
} from '@core/interfaces';
import { PatronTier } from 'libs/shared/src/api/entities/hosts/patron-tier.entity';
import { BackendProviderMap } from '..';
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
      authorisation: AuthStrat.hasHostPermission(HostPermission.Admin),
      controller: async req => {
        const host = await getCheck(Host.findOne({ _id: req.params.hid }, { relations: ['patron_tiers'] }));
        const [isMemberOfHost] = await AuthStrat.hasHostPermission(HostPermission.Admin, () => host._id)(
          req,
          this.providers
        );

        return isMemberOfHost ? host.patron_tiers.map(t => t.toHost()) : host.patron_tiers.map(t => t.toFull());
      }
    };
  }

  deletePatronTier(): IControllerEndpoint<void> {
    return {
      authorisation: AuthStrat.hasHostPermission(HostPermission.Admin),
      controller: async req => {
        const tier = await getCheck(PatronTier.findOne({ _id: req.params.tid }));
        await tier.softRemove();
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
