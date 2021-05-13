import { BaseController, getCheck, Host, IControllerEndpoint, PatronSubscription, User, Validators } from '@core/api';
import { uuid } from '@core/helpers';
import { HostPermission, IHostPatronTier, IPatronSubscription, IPatronTier } from '@core/interfaces';
import { PatronTier } from 'libs/shared/src/api/entities/hosts/patron-tier.entity';
import { BackendProviderMap } from '..';
import AuthStrat from '../common/authorisation';
import Email = require('../common/email');

// Stripe Connected Subscriptions --------------------------------------------------------------
// https://stripe.com/img/docs/subscriptions/invoice-lifecycle-incomplete-incomplete_expired.svg

export default class PatronageController extends BaseController<BackendProviderMap> {
  createPatronTier(): IControllerEndpoint<IHostPatronTier> {
    return {
      validators: { body: Validators.Objects.DtoCreatePatronTier },
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

  unsubscribeFromPatronTier(): IControllerEndpoint<void> {
    return {
      authorisation: AuthStrat.isLoggedIn,
      controller: async req => {}
    };
  }

  subscribeToPatronTier(): IControllerEndpoint<IPatronSubscription> {
    return {
      authorisation: AuthStrat.isLoggedIn,
      controller: async req => {
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

        // User is a Customer on our Platform, we need to copy this user into the hosts Connected account
        // provision one-time token which we can use to copy the Customer over
        const token = await this.providers.stripe.connection.tokens.create(
          {
            customer: user.stripe_customer_id
          },
          { stripeAccount: tier.host.stripe_account_id }
        );

        const copiedCustomer = await this.providers.stripe.connection.customers.create(
          {
            description: `StageUp User ${tier.host._id}`,
            source: token.id
          },
          {
            stripeAccount: tier.host.stripe_account_id
          }
        );

        // https://stripe.com/docs/connect/subscriptions#direct
        // Now we create a subscription on behalf of the hosts' Connected account, for the Product that was created on there
        const stripeSubscription = await this.providers.stripe.connection.subscriptions.create(
          {
            customer: copiedCustomer.id,
            metadata: {
              host_id: tier.host._id,
              user_id: user._id,
              patron_tier_id: tier._id,
              patron_subscription_id: patronSubscriptionId
            },
            items: [{ price: tier.stripe_price_id }],
            application_fee_percent: 0, // IMPORTANT: may require changes at some point when Drake changes his mind
            expand: ['latest_invoice.payment_intent']
          },
          // ...For this to work, both the customer and the price must be defined on the _connected account_.
          { stripeAccount: tier.host.stripe_account_id }
        );

        const patronSubscription = await this.ORM.transaction(async txc => {
          const sub = new PatronSubscription(stripeSubscription, user, tier);
          sub._id = patronSubscriptionId;
          await txc.save(sub);

          tier.total_patrons += 1;
          await txc.save(tier);
          return sub;
        });

        // TODO: add back all emails
        // Email.sendUserPatronSubscriptionConfirmation(user, tier);
        // Email.sendHostPatronTierPurchaseConfirmation(user, tier);

        return patronSubscription.toFull();
      }
    };
  }
}
