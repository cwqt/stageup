import { getCheck } from '@backend/common/error';
import {
  EventBus,
  EVENT_BUS_PROVIDER,
  IControllerEndpoint,
  Logger,
  LOGGING_PROVIDER,
  ModuleController,
  StripeProvider,
  STRIPE_PROVIDER,
  UserHostInfo
} from '@core/api';
import { Environment, HandledStripeHooks, HostPermission, StripeHook } from '@core/interfaces';
import Stripe from 'stripe';
import { Inject, Service } from 'typedi';
import AuthStrat from '../../common/authorisation';
import Env from '../../env';

@Service()
export class StripeController extends ModuleController {
  readonly webhooks: {
    [index in HandledStripeHooks]?: (data: Stripe.Event.Data) => Promise<void>;
  };

  constructor(
    @Inject(LOGGING_PROVIDER) private log: Logger,
    @Inject(EVENT_BUS_PROVIDER) private bus: EventBus,
    @Inject(STRIPE_PROVIDER) private stripe: Stripe
  ) {
    super();

    // prettier-ignore
    this.webhooks = {
      [StripeHook.PaymentIntentCreated]:    v => this.bus.publish("stripe.payment_intent.created",        v, { language: "en", region: "GB"}),
      [StripeHook.PaymentIntentSucceded]:   v => this.bus.publish("stripe.payment_intent.succeeded",      v, { language: "en", region: "GB"}),
      [StripeHook.InvoicePaymentSucceeded]: v => this.bus.publish("stripe.invoice.payment_succeeded",     v, { language: "en", region: "GB"}),
      [StripeHook.ChargeRefunded]:          v => this.bus.publish("stripe.charge.refunded",               v, { language: "en", region: "GB"}),
      [StripeHook.SubscriptionDeleted]:     v => this.bus.publish("stripe.customer.subscription.deleted", v, { language: "en", region: "GB"}),
    };
  }

  handleHook: IControllerEndpoint<{ received: boolean }> = {
    authorisation: async req => {
      // index.ts Register has a body_parser option that tacks on the raw body on req
      try {
        this.stripe.webhooks.signature.verifyHeader(
          (req as any).rawBody,
          req.headers['stripe-signature'] as string,
          Env.STRIPE.WEBHOOK_SIGNATURE
        );
      } catch (error) {
        this.log.error(error);
        return [false, {}, '@@error.invalid'];
      }

      return [true, {}];
    },
    // https://github.com/stripe/stripe-node/blob/master/examples/webhook-signing/typescript-node-express/express-ts.ts
    controller: async req => {
      const event = req.body as Stripe.Event;
      this.log.http(`Received Stripe hook: ${event.type}`);

      await (this.webhooks[event.type] || this.unsupportedHookHandler.bind(this))(event.data);
      return { received: true };
      // FIXME: Figure out some way of handling webhooks from other peoples machines coming to ours
      // idempotency keys?
      // Check from metadata that this machine sent this request
      // if ((event.data.object as any)?.metadata?.__origin_url == Env.WEBHOOK_URL) {
      //   await (this.hookMap[event.type] || this.unsupportedHookHandler)(event);
      //   return { received: true };
      // } else {
      //   // throw new ErrorHandler(HTTP.Conflict, '@@stripe.origin_url_not_matched');
      // }
    }
  };

  handleStripeConnectReturn: IControllerEndpoint<string> = {
    authorisation: AuthStrat.isLoggedIn,
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
      const res = await this.stripe.accounts.retrieve({
        stripeAccount: uhi.host.stripe_account_id
      });

      await this.bus.publish(
        'host.stripe_connected',
        {
          host_id: uhi.host._id
        },
        req.locale
      );

      // Live Charges always disabled in development/testing, so just return true
      return `${Env.FRONTEND.URL}/${req.locale.language}/dashboard/payments?connect-success=${
        Env.isEnv(Environment.Development) ? true : res.charges_enabled
      }`;
      // https://stripe.com/docs/connect/enable-payment-acceptance-guide#web-accept-payment
      // After Stripe standard account connected, users can create PaymentIntents
      // where which we can take an `application_fee_amount` from the purchase
    }
  };

  async unsupportedHookHandler(event: Stripe.Event) {
    this.log.warn(`Un-supported Stripe hook: ${event.type}`);
  }
}
