import { getCheck } from '@backend/common/error';
import {
  AccessToken,
  Contract,
  EventBus,
  EVENT_BUS_PROVIDER,
  Invoice,
  Logger,
  LOGGING_PROVIDER,
  ModuleEvents,
  PatronSubscription,
  PaymentMethod,
  POSTGRES_PROVIDER,
  STRIPE_PROVIDER,
  Ticket,
  User
} from '@core/api';
import { timestamp } from '@core/helpers';
import {
  ConsentOpt,
  CurrencyCode,
  IStripeChargePassthrough,
  PaymentStatus,
  PurchaseableType,
  RefundResponseReason,
  PlatformConsentOpt,
  TokenProvisioner
} from '@core/interfaces';
import Stripe from 'stripe';
import { Inject, Service } from 'typedi';
import { Connection, IsNull } from 'typeorm';

@Service()
export class StripeEvents extends ModuleEvents {
  constructor(
    @Inject(EVENT_BUS_PROVIDER) private bus: EventBus,
    @Inject(STRIPE_PROVIDER) private stripe: Stripe,
    @Inject(LOGGING_PROVIDER) private log: Logger,
    @Inject(POSTGRES_PROVIDER) private pg: Connection
  ) {
    super();
    this.events = {
      ['stripe.payment_intent.created']: this.handlePaymentIntentCreated,
      ['stripe.payment_intent.succeeded']: this.handlePaymentIntentSuccessful,
      ['stripe.charge.refunded']: this.handleRefundSuccessful,
      ['stripe.invoice.payment_succeeded']: this.handleInvoicePaymentSuccessful,
      ['stripe.customer.subscription.deleted']: this.handleSubscriptionDeleted
    };
  }

  async handleInvoicePaymentSuccessful(ct: Contract<'stripe.payment_intent.succeeded'>) {
    // For handling purchases of subscriptions
    const data = ct.object as Stripe.Invoice;
    const purchaseable = await PatronSubscription.findOne(
      { stripe_subscription_id: data.subscription as string },
      { relations: { patron_tier: { host: true }, user: true } }
    );

    const subscription = await this.stripe.subscriptions.retrieve(data.subscription as string, {
      stripeAccount: purchaseable.patron_tier.host.stripe_account_id
    });

    const passthrough = subscription.metadata as IStripeChargePassthrough;

    // Update the last used date of the card
    const method = await PaymentMethod.findOne({ _id: passthrough.payment_method_id });
    method.last_used_at = timestamp();
    await method.save();

    // Create the Invoice locally
    await this.pg.transaction(async txc => {
      const intent = await this.stripe.paymentIntents.retrieve(data.payment_intent as string, {
        stripeAccount: purchaseable.patron_tier.host.stripe_account_id
      });

      const user = await User.findOne({ _id: passthrough.user_id });
      const invoice = new Invoice(
        user,
        purchaseable.patron_tier.amount,
        purchaseable.patron_tier.currency,
        intent,
        method
      )
        .setHost(purchaseable.patron_tier.host)
        .setPurchaseable(purchaseable);

      invoice.status = PaymentStatus.Paid;
      await txc.save(invoice);

      purchaseable.last_invoice = invoice;
      await txc.save(purchaseable);
    });
  }

  async handlePaymentIntentSuccessful(ct: Contract<'stripe.payment_intent.succeeded'>) {
    console.log(ct);

    const intent = ct.object as Stripe.PaymentIntent;
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

        const invoice = await this.pg.transaction(async txc => {
          // Create a new invoice for the user which provisions an Access Token for the performance
          ticket.quantity_remaining -= 1;
          const invoice = new Invoice(
            user,
            intent.amount,
            intent.currency.toUpperCase() as CurrencyCode,
            intent,
            method
          )
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

        this.bus.publish(
          'ticket.purchased',
          {
            purchaser_id: user._id,
            invoice_id: invoice._id,
            ticket_id: ticket._id,
            host_id: ticket.performance.host._id,
            // from performance.controller.ts in purchasing a ticket
            host_marketing_consent: passthrough.host_marketing_consent as ConsentOpt | null,
            platform_marketing_consent: passthrough.platform_marketing_consent as PlatformConsentOpt | null
          },
          user.locale
        );
      }
    }
  }

  async handleSubscriptionDeleted(ct: Contract<'stripe.customer.subscription.deleted'>) {
    const data = ct.object as Stripe.Subscription;
    const sub = await PatronSubscription.findOne({
      where: { stripe_subscription_id: data.id },
      relations: { user: true },
      select: { _id: true, stripe_subscription_id: true, user: { _id: true, locale: true } }
    });

    await this.bus.publish('patronage.user_unsubscribed', { sub_id: sub._id, user_id: sub.user._id }, sub.user.locale);
  }

  async handlePaymentIntentCreated(ct: Contract<'stripe.payment_intent.created'>) {
    const intent = ct.object as Stripe.PaymentIntent;
  }

  async handleRefundSuccessful(ct: Contract<'stripe.charge.refunded'>) {
    const stripeRefund = ct.object as Stripe.Refund;

    const invoice = await getCheck(
      Invoice.findOne({
        where: {
          stripe_payment_intent_id: stripeRefund.payment_intent as string,
          refunds: {
            responded_on: IsNull()
          }
        },
        relations: ['refunds', 'user']
      })
    );

    const currentRefund = invoice.refunds[0];
    currentRefund.responded_on = timestamp();
    currentRefund.is_refunded = true;
    currentRefund.response_reason = RefundResponseReason.Accepted;
    currentRefund.response_detail = '';

    invoice.status = PaymentStatus.Refunded;
    await Promise.all([currentRefund.save(), invoice.save()]);

    await this.bus.publish(
      'refund.refunded',
      { invoice_id: invoice._id, user_id: invoice.user._id, refund_id: currentRefund._id },
      invoice.user.locale
    );
  }
}
