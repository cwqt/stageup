import {
  CurrencyCode,
  ErrCode,
  HostPermission,
  StripeHook,
  TokenProvisioner,
  PurchaseableEntity
} from '@core/interfaces';
import {
  BaseController,
  getCheck,
  IControllerEndpoint,
  UserHostInfo,
  BaseArguments,
  User,
  Ticket,
  Invoice,
  AccessToken,
  SigningKey
} from '@core/shared/api';
import { BackendProviderMap } from '..';
import AuthStrat from '../common/authorisation';
import Env from '../env';

import Stripe from 'stripe';
import { log } from '../common/logger';
import Email = require('../common/email');

export default class StripeController extends BaseController<BackendProviderMap> {
  readonly hookMap: {
    [index in StripeHook]?: (data: Stripe.Event.Data) => Promise<void>;
  };

  constructor(...args: BaseArguments<BackendProviderMap>) {
    super(...args);
    this.hookMap = {
      [StripeHook.ChargeSucceded]: this.handleChargeSuccessful.bind(this),
      [StripeHook.PaymentIntentCreated]: this.handlePaymentIntentCreated.bind(this)
    };
  }

  handleHook(): IControllerEndpoint<{ received: boolean }> {
    return {
      authStrategy: async req => {
        // index.ts Register has a body_parser option that tacks on the raw body on req
        try {
          this.providers.stripe.connection.webhooks.signature.verifyHeader(
            (req as any).rawBody,
            req.headers['stripe-signature'] as string,
            this.providers.stripe.config.hook_signature
          );
        } catch (error) {
          log.error(error);
          return [false, {}, ErrCode.INVALID];
        }

        return [true, {}];
      },
      // https://github.com/stripe/stripe-node/blob/master/examples/webhook-signing/typescript-node-express/express-ts.ts
      controller: async req => {
        const event = req.body as Stripe.Event;
        log.http(`Received Stripe hook: ${event.type}`);

        await (this.hookMap[event.type] || this.unsupportedHookHandler)(event);
        return { received: true };
      }
    };
  }

  async handleChargeSuccessful(event: Stripe.Event) {
    const data = event.data.object as Stripe.Charge;

    // User purchased a performance, have some metadata stored in the PaymentIntent
    const { user_id, ticket_id } = data.metadata;
    const user = await User.findOne({ _id: user_id });
    const ticket = await Ticket.findOne({
      where: {
        _id: ticket_id
      },
      relations: {
        performance: {
          host: true,
          host_info: {
            signing_key: true
          }
        }
      },
      select: {
        performance: {
          host: {
            _id: true
          }
        }
      }
    });

    await this.ORM.transaction(async txc => {
      // Create a new invoice for the user which provisions an access token for the performance
      ticket.quantity_remaining -= 1;
      const invoice = new Invoice(user, data.amount, data.currency.toUpperCase() as CurrencyCode, data)
        .setHost(ticket.performance.host) // should be party to hosts invoices
        .setTicket(ticket); // purchased a ticket

      await txc.save(invoice);

      // Create & sign for the user on this performance
      const token = new AccessToken(user, ticket.performance, invoice, TokenProvisioner.Purchase);
      await token.sign(ticket.performance.host_info.signing_key);
      await txc.save(token);

      // Save the remaining ticket quantity
      await txc.save(ticket);
    });

    Email.sendTicketPurchaseConfirmation(user, ticket, ticket.performance, data.receipt_url);
  }

  async handlePaymentIntentCreated(event: Stripe.Event) {
    const data = event.data.object as Stripe.Charge;
  }

  async unsupportedHookHandler(event: Stripe.Event) {
    log.warn(`Un-supported Stripe hook: ${event.type}`);
  }

  handleStripeConnectReturn(): IControllerEndpoint<string> {
    return {
      authStrategy: AuthStrat.none,
      controller: async req => {
        // https://stripe.com/docs/connect/enable-payment-acceptance-guide#web-handle-user-returning-to-platform
        // No state is passed through this URL. After a user is redirected to your return_url,
        // check the state of the details_submitted parameter on their account by
        // calling the Accounts API and inspecting the returned object.

        // Still have user session, so find host that user is a Owner of;
        const uhi = await getCheck(
          UserHostInfo.findOne({
            relations: { host: true, user: true },
            where: {
              permissions: HostPermission.Owner,
              user: {
                _id: req.session.user._id
              }
            },
            select: {
              user: {
                _id: true
              }
            }
          })
        );

        // https://stripe.com/docs/connect/enable-payment-acceptance-guide#web-handle-incomplete-onboarding
        // > check for `charges_enabled` (to see if onboarding was completed)
        const res = await this.providers.stripe.connection.accounts.retrieve({
          stripeAccount: uhi.host.stripe_account_id
        });

        return `${Env.FE_URL}/dashboard/payments?connect-success=${res.charges_enabled}`;
        // https://stripe.com/docs/connect/enable-payment-acceptance-guide#web-accept-payment
        // After Stripe standard account connected, users can create PaymentIntents
        // where which we can take an `application_fee_amount` from the purchase
      }
    };
  }

  handleStripeConnectRefresh(): IControllerEndpoint<string> {
    return {
      authStrategy: AuthStrat.none,
      controller: async req => {
        // refresh_url
        //  Your user will be redirected to the refresh_url in these cases:
        //  * The link is expired (a few minutes went by since the link was created)
        //  * The link was already visited (the user refreshed the page or clicked back or forward in the browser)
        //  * Your platform is no longer able to access the account
        //  * The account has been rejected
        //  * Your refresh_url should trigger a method on your server to call Account Links again with the
        // same parameters, and redirect the user to the Connect Onboarding flow to create a seamless experience.

        return `${Env.FE_URL}/dashboard/payments`;
      }
    };
  }
}
