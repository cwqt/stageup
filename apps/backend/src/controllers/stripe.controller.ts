import {
  CurrencyCode,
  HostPermission,
  StripeHook,
  TokenProvisioner,
  PurchaseableType,
  PaymentStatus,
  IStripeChargePassthrough,
  Environment
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
  PatronTier,
  PaymentMethod,
  PatronSubscription
} from '@core/api';
import { BackendProviderMap } from '..';
import AuthStrat from '../common/authorisation';
import Env from '../env';

import Stripe from 'stripe';
import { log } from '../common/logger';
import Email = require('../common/email');
import { parseRichText, stringifyRichText, timestamp } from '@core/helpers';

export default class StripeController extends BaseController<BackendProviderMap> {
  readonly hookMap: {
    [index in StripeHook]?: (data: Stripe.Event.Data) => Promise<void>;
  };

  constructor(...args: BaseArguments<BackendProviderMap>) {
    super(...args);
    this.hookMap = {
      [StripeHook.PaymentIntentCreated]: this.handlePaymentIntentCreated.bind(this),
      [StripeHook.PaymentIntentSucceded]: this.handlePaymentIntentSuccessful.bind(this),
      [StripeHook.InvoicePaymentSucceeded]: this.handleInvoicePaymentSuccessful.bind(this)
    };
  }

  handleHook(): IControllerEndpoint<{ received: boolean }> {
    return {
      authorisation: async req => {
        // index.ts Register has a body_parser option that tacks on the raw body on req
        try {
          this.providers.stripe.connection.webhooks.signature.verifyHeader(
            (req as any).rawBody,
            req.headers['stripe-signature'] as string,
            this.providers.stripe.config.hook_signature
          );
        } catch (error) {
          log.error(error);
          return [false, {}, '@@error.invalid'];
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

  async handleInvoicePaymentSuccessful(event: Stripe.Event) {
    // For handling purchases of subscriptions
    const data = event.data.object as Stripe.Invoice;
    const purchaseable = await PatronSubscription.findOne(
      { stripe_subscription_id: data.subscription as string },
      { relations: { patron_tier: { host: true }, user: true } }
    );

    const subscription = await this.providers.stripe.connection.subscriptions.retrieve(data.subscription as string, {
      stripeAccount: purchaseable.patron_tier.host.stripe_account_id
    });

    const passthrough = subscription.metadata as IStripeChargePassthrough;

    // Update the last used date of the card
    const method = await PaymentMethod.findOne({ _id: passthrough.payment_method_id });
    method.last_used_at = timestamp();
    await method.save();

    // Create the Invoice locally
    await this.ORM.transaction(async txc => {
      const intent = await this.providers.stripe.connection.paymentIntents.retrieve(data.payment_intent as string, {
        stripeAccount: purchaseable.patron_tier.host.stripe_account_id
      });

      const user = await User.findOne({ _id: passthrough.user_id });
      const invoice = new Invoice(user, purchaseable.patron_tier.amount, purchaseable.patron_tier.currency, intent)
        .setHost(purchaseable.patron_tier.host)
        .setPurchaseable(purchaseable);

      invoice.status = PaymentStatus.Paid;
      return await txc.save(invoice);
    });
  }

  async handlePaymentIntentSuccessful(event: Stripe.Event) {
    const intent = event.data.object as Stripe.PaymentIntent;
    const passthrough = intent.metadata as IStripeChargePassthrough;

    // Update the last used date of the card
    const method = await PaymentMethod.findOne({ _id: passthrough.payment_method_id });
    method.last_used_at = timestamp();
    await method.save();

    // Handle generating the invoices & such for different types of purchaseables
    switch (passthrough.purchaseable_type) {
      // Purchased Ticket ----------------------------------------------------------------------------
      case PurchaseableType.Ticket: {
        const user = await getCheck(User.findOne({ _id: passthrough.user_id }));
        const ticket = await getCheck(
          Ticket.findOne({
            where: {
              _id: passthrough.purchaseable_id
            },
            relations: {
              claim: true,
              performance: {
                host: true
              }
            },
            select: {
              performance: {
                host: {
                  _id: true
                }
              }
            }
          })
        );

        const invoice = await this.ORM.transaction(async txc => {
          // Create a new invoice for the user which provisions an Access Token for the performance
          ticket.quantity_remaining -= 1;
          const invoice = new Invoice(user, intent.amount, intent.currency.toUpperCase() as CurrencyCode, intent)
            .setHost(ticket.performance.host) // should be party to hosts invoices
            .setPurchaseable(ticket); // purchased a ticket

          invoice.status = PaymentStatus.Paid;
          await txc.save(invoice);

          // Create an AT for the user on this tickets claims
          const token = new AccessToken(user, ticket.claim, invoice, TokenProvisioner.Purchase);
          await txc.save(token);

          // Save the remaining ticket quantity
          await txc.save(ticket);
          return invoice;
        });

        this.providers.bus.publish(
          'ticket.purchased',
          { purchaser_id: user._id, invoice_id: invoice._id },
          user.locale
        );
      }
    }
  }

  async handlePaymentIntentCreated(event: Stripe.Event) {
    const intent = event.data.object as Stripe.PaymentIntent;
  }

  async unsupportedHookHandler(event: Stripe.Event) {
    log.warn(`Un-supported Stripe hook: ${event.type}`);
  }

  handleStripeConnectReturn(): IControllerEndpoint<string> {
    return {
      authorisation: AuthStrat.none,
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

        await this.providers.bus.publish(
          'host.stripe-connected',
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
  }
}
