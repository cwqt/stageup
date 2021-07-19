import Env from '@backend/env';
import {
  ErrorHandler,
  Host,
  Invoice,
  PatronSubscription,
  PatronTier,
  Performance,
  Refund,
  transact,
  User
} from '@core/api';
import { dateOrdinal, i18n, pipes, richtext, timestamp, timeout } from '@core/helpers';
import { CurrencyCode, HTTP, PatronSubscriptionStatus } from '@core/interfaces';
import dbless from 'dbless-email-verification';

// FOR SENDING EMAILS: ----------------------------------------------------------
// define the event & contract that goes along with it
// emit the event & contract data on onto the event bus
// setup a listener in one of the modules for that event
// write an event handler, that will do something with the event
//   - for emails, write the email in english in the i18n.hjson file
//   - reference the i18n token in the providers.i18n.translate
//   - add all the variables in the .translate that are in the ICU string {username}
//   - add the email to the send_email queue for the workers to process at some later date (immediately)
// ------------------------------------------------------------------------------
import { Contract } from 'libs/shared/src/api/event-bus/contracts';
import moment from 'moment';
import { In } from 'typeorm';
import { QueueModule, QueueProviders } from './queue.module';

export const EventHandlers = (queues: QueueModule['queues'], providers: QueueProviders) => ({
  sendTestEmail: async (ct: Contract<'test.send_email'>) => {
    const user = await User.findOne({ _id: ct.user_id }, { select: ['email_address', 'username', 'name'] });
    queues.send_email.add({
      subject: providers.i18n.translate('@@email.test.send_email__subject', ct.__meta.locale),
      content: providers.i18n.translate('@@email.test.send_email__content', ct.__meta.locale, {
        username: user.username,
        url: Env.FRONTEND.URL
      }),
      from: Env.EMAIL_ADDRESS,
      to: user.email_address,
      markdown: true,
      attachments: []
    });
  },

  sendUserVerificationEmail: async (ct: Contract<'user.registered'>) => {
    const hash = dbless.generateVerificationHash(ct.email_address, Env.PRIVATE_KEY, 60);
    const verificationUrl = `${Env.BACKEND.URL}/auth/verify-email?email_address=${ct.email_address}&hash=${hash}`;

    queues.send_email.add({
      subject: providers.i18n.translate('@@email.user.registered__subject', ct.__meta.locale),
      content: providers.i18n.translate('@@email.user.registered__content', ct.__meta.locale, { url: verificationUrl }),
      from: Env.EMAIL_ADDRESS,
      to: ct.email_address,
      markdown: true,
      attachments: []
    });
  },

  sendUserHostInviteEmail: async (ct: Contract<'user.invited_to_host'>) => {
    // Re_direct to frontend which will then send a request to backend host landing page
    const acceptanceUrl = `${Env.BACKEND.URL}/hosts/${ct.host_id}/invites/${ct.invite_id}`;

    const inviter = await User.findOne({ _id: ct.inviter_id }, { select: ['email_address', 'username', 'name'] });
    const invitee = await User.findOne({ _id: ct.invitee_id }, { select: ['email_address', 'username', 'name'] });
    const host = await Host.findOne({ _id: ct.host_id }, { select: ['username', 'name'] });

    queues.send_email.add({
      subject: providers.i18n.translate('@@email.user.invited_to_host__subject', ct.__meta.locale, {
        inviter_name: inviter.name || inviter.username,
        host_name: host.username
      }),
      content: providers.i18n.translate('@@email.user.invited_to_host__content', ct.__meta.locale, {
        user_name: invitee.name || invitee.username,
        url: acceptanceUrl
      }),
      from: Env.EMAIL_ADDRESS,
      to: invitee.email_address,
      markdown: true,
      attachments: []
    });
  },

  sendUserPrivatePerformanceInviteEmail: async (ct: Contract<'user.invited_to_private_showing'>) => {
    const user = await User.findOne({ _id: ct.user_id }, { select: ['email_address', 'username', 'name'] });
    const performance = await Performance.findOne({ _id: ct.performance_id }, { select: ['name'] });
    const host = await Host.findOne({ _id: ct.host_id }, { select: ['username', 'name'] });
    const performanceLink = `${Env.FRONTEND.URL}/${ct.__meta.locale}}/performances/${performance._id}/watch`;

    queues.send_email.add({
      subject: providers.i18n.translate('@@email.user.invited_to_private_showing__subject', ct.__meta.locale),
      content: providers.i18n.translate('@@email.user.invited_to_private_showing__content', ct.__meta.locale, {
        url: performanceLink,
        user_name: user.name || user.username,
        performance_name: performance.name,
        host_name: host.name || host.username
      }),
      from: Env.EMAIL_ADDRESS,
      to: user.email_address,
      markdown: true,
      attachments: []
    });
  },

  sendTicketReceiptEmail: async (ct: Contract<'ticket.purchased'>) => {
    const user = await User.findOne({ _id: ct.purchaser_id }, { select: ['email_address', 'username', 'name'] });
    const invoice = await Invoice.findOne(
      { _id: ct.invoice_id },
      { relations: { ticket: { performance: { host: true } } } }
    );
    const performanceLink = `${Env.FRONTEND.URL}/${ct.__meta.locale}/performances/${invoice.ticket.performance._id}/watch`;

    queues.send_email.add({
      subject: providers.i18n.translate('@@email.user.invited_to_private_showing__subject', ct.__meta.locale),
      content: providers.i18n.translate('@@email.ticket.purchased__content', ct.__meta.locale, {
        receipt_url: invoice.stripe_receipt_url,
        user_name: user.name || user.username,
        ticket_name: invoice.ticket.name,
        performance_name: invoice.ticket.performance.name,
        amount: i18n.money(invoice.amount, invoice.currency),
        watch_url: performanceLink
      }),
      from: Env.EMAIL_ADDRESS,
      to: user.email_address,
      markdown: true,
      attachments: []
    });
  },

  sendHostPatronSubscriptionStartedEmail: async (ct: Contract<'patronage.started'>) => {
    const user = await User.findOne({ _id: ct.user_id }, { select: ['email_address', 'name', 'username'] });
    const tier = await PatronTier.findOne({ _id: ct.tier_id }, { relations: ['host'] });
    queues.send_email.add({
      subject: providers.i18n.translate('@@email.host.patronage_started__subject', ct.__meta.locale, {
        tier_name: tier.name
      }),
      content: providers.i18n.translate('@@email.host.patronage_started__content', ct.__meta.locale, {
        tier_name: tier.name,
        user_username: user.username,
        host_name: tier.host.name || tier.host.username,
        amount: i18n.money(tier.amount, tier.currency)
      }),
      from: Env.EMAIL_ADDRESS,
      to: tier.host.email_address,
      markdown: true,
      attachments: []
    });
  },

  sendUserPatronSubscriptionStartedReceiptEmail: async (ct: Contract<'patronage.started'>) => {
    const user = await User.findOne({ _id: ct.user_id }, { select: ['email_address', 'name', 'username'] });
    const tier = await PatronTier.findOne({ _id: ct.tier_id }, { relations: ['host'] });

    queues.send_email.add({
      subject: providers.i18n.translate('@@email.user.patronage_started__subject', ct.__meta.locale, {
        tier_name: tier.name
      }),
      content: providers.i18n.translate('@@email.user.patronage_started__content', ct.__meta.locale, {
        user_name: user.name || user.username,
        host_name: tier.host.name || tier.host.username,
        date_ordinal: dateOrdinal(new Date(), true),
        tos_url: `${Env.FRONTEND.URL}/${ct.__meta.locale}}/terms_of_service`,
        amount: i18n.money(tier.amount, tier.currency)
      }),
      from: Env.EMAIL_ADDRESS,
      to: user.email_address,
      markdown: true,
      attachments: []
    });
  },

  sendPasswordResetLinkEmail: async (ct: Contract<'user.password_reset_requested'>) => {
    const user = await User.findOne({ _id: ct.user_id }, { select: ['_id', 'email_address'] });

    queues.send_email.add({
      subject: providers.i18n.translate('@@email.user.password_reset_requested__subject', ct.__meta.locale),
      content: providers.i18n.translate('@@email.user.password_reset_requested__content', ct.__meta.locale),
      from: Env.EMAIL_ADDRESS,
      to: user.email_address,
      markdown: true,
      attachments: []
    });
  },

  sendPasswordChangedNotificationEmail: async (ct: Contract<'user.password_changed'>) => {
    const user = await User.findOne({ _id: ct.user_id }, { select: ['_id', 'email_address'] });

    queues.send_email.add({
      subject: providers.i18n.translate('@@email.user.password_changed__subject', ct.__meta.locale),
      content: providers.i18n.translate('@@email.user.password_changed__content', ct.__meta.locale),
      from: Env.EMAIL_ADDRESS,
      to: user.email_address,
      markdown: true,
      attachments: []
    });
  },

  sendHostRefundRequestEmail: async (ct: Contract<'refund.requested'>) => {
    const invoice = await Invoice.findOne(
      { _id: ct.invoice_id },
      { relations: { user: true, ticket: { performance: true }, host: true } }
    );

    queues.send_email.add({
      subject: providers.i18n.translate('@@email.host_refund_requested_confirmation__subject', ct.__meta.locale, {
        performance_name: invoice.ticket.performance.name,
        user_username: invoice.user.username
      }),

      content: providers.i18n.translate('@@email.host_refund_requested_confirmation__content', ct.__meta.locale, {
        host_name: invoice.host.username,
        user_username: invoice.user.username,
        user_email_address: invoice.user.email_address,
        invoice_id: invoice._id,
        performance_name: invoice.ticket.performance.name,
        purchase_date: moment.unix(invoice.purchased_at).format('LLLL'),
        amount: i18n.money(invoice.amount, invoice.currency),
        invoice_dashboard_url: `${Env.FRONTEND.URL}/${ct.__meta.locale.language}/dashboard/payments/invoices`
      }),

      from: Env.EMAIL_ADDRESS,
      to: invoice.host.email_address,
      markdown: true,
      attachments: []
    });
  },

  sendInvoiceRefundRequestConfirmation: async (ct: Contract<'refund.requested'>) => {
    // FUTURE Have different strategies for different types of purchaseables?
    const invoice = await Invoice.findOne(
      { _id: ct.invoice_id },
      { relations: { user: true, ticket: { performance: true }, host: true } }
    );

    queues.send_email.add({
      subject: providers.i18n.translate('@@email.refund_requested__subject', ct.__meta.locale, {
        host_name: invoice.host.username
      }),
      content: providers.i18n.translate('@@email.refund_requested__content', ct.__meta.locale, {
        host_name: invoice.host.name,
        invoice_id: invoice._id,
        performance_name: invoice.ticket.performance.name,
        purchase_date: moment.unix(invoice.purchased_at).format('LLLL'),
        amount: i18n.money(invoice.amount, invoice.currency)
      }),
      from: Env.EMAIL_ADDRESS,
      to: invoice.user.email_address,
      markdown: true,
      attachments: []
    });
  },

  setupDefaultPatronTierForHost: async (ct: Contract<'host.stripe_connected'>) => {
    await transact(async txc => {
      const host = await Host.findOne({ _id: ct.host_id });
      const tier = new PatronTier(
        {
          name: providers.i18n.translate('@@host.example_patron_tier_name', ct.__meta.locale),
          description: richtext.read(
            richtext.create(providers.i18n.translate(`@@host.example_patron_tier_description`, ct.__meta.locale))
          ),
          amount: 1000, // 10 GBP
          currency: CurrencyCode.GBP
        },
        host
      );

      await tier.setup(providers.stripe.connection, txc);
    });
  },

  sendHostRefundInitiatedEmail: async (ct: Contract<'refund.initiated'>) => {
    const invoice = await Invoice.findOne({
      where: {
        _id: ct.invoice_id
      },
      relations: {
        ticket: {
          performance: true
        },
        host: true
      }
    });

    const user = await User.findOne({ _id: ct.user_id }, { select: ['_id', 'email_address', 'username'] });

    await queues.send_email.add({
      subject: providers.i18n.translate('@@email.host.refund_initiated__subject', ct.__meta.locale, {
        user_username: user.username,
        performance_name: invoice.ticket.performance.name
      }),
      content: providers.i18n.translate('@@email.host.refund_initiated__content', ct.__meta.locale, {
        host_name: invoice.host.name,
        performance_name: invoice.ticket.performance.name,
        invoice_id: invoice._id,
        invoice_amount: i18n.money(invoice.amount, invoice.currency)
      }),
      from: Env.EMAIL_ADDRESS,
      to: user.email_address,
      markdown: true,
      attachments: []
    });
  },

  sendUserRefundInitiatedEmail: async (ct: Contract<'refund.initiated'>) => {
    const invoice = await Invoice.findOne({
      where: {
        _id: ct.invoice_id
      },
      relations: {
        ticket: {
          performance: true
        },
        host: true,
        payment_method: true
      }
    });
    const user = await User.findOne({ _id: ct.user_id }, { select: ['_id', 'email_address'] });

    await queues.send_email.add({
      subject: providers.i18n.translate('@@email.user.refund_initiated__subject', ct.__meta.locale, {
        host_name: invoice.host.name,
        performance_name: invoice.ticket.performance.name
      }),
      content: providers.i18n.translate('@@email.user.refund_initiated__content', ct.__meta.locale, {
        user_username: user.username,
        host_name: invoice.host.name,
        performance_name: invoice.ticket.performance.name,
        last_4: invoice.payment_method.last4,
        card_brand: pipes.cardBrand(invoice.payment_method.brand),
        invoice_id: invoice._id,
        invoice_amount: i18n.money(invoice.amount, invoice.currency)
      }),
      from: Env.EMAIL_ADDRESS,
      to: user.email_address,
      markdown: true,
      attachments: []
    });
  },

  sendHostRefundRefundedEmail: async (ct: Contract<'refund.refunded'>) => {
    const invoice = await Invoice.findOne({
      where: {
        _id: ct.invoice_id
      },
      relations: {
        user: true,
        payment_method: true,
        ticket: {
          performance: true
        },
        host: true
      }
    });

    queues.send_email.add({
      subject: providers.i18n.translate('@@email.host.refund_refunded__subject', ct.__meta.locale, {
        invoice_id: invoice._id,
        user_username: invoice.user.username,
        performance_name: invoice.ticket.performance.name
      }),
      content: providers.i18n.translate('@@email.host.refund_refunded__content', ct.__meta.locale, {
        host_name: invoice.host.name,
        user_username: invoice.user.username,
        performance_name: invoice.ticket.performance.name,
        invoice_amount: i18n.money(invoice.amount, invoice.currency)
      }),
      from: Env.EMAIL_ADDRESS,
      to: invoice.host.email_address,
      markdown: true,
      attachments: []
    });
  },

  sendUserRefundRefundedEmail: async (ct: Contract<'refund.refunded'>) => {
    const invoice = await Invoice.findOne({
      where: {
        _id: ct.invoice_id
      },
      relations: {
        user: true,
        payment_method: true,
        ticket: {
          performance: true
        },
        host: true
      }
    });

    const refund = await Refund.findOne({ _id: ct.refund_id });

    queues.send_email.add({
      subject: providers.i18n.translate('@@email.user.refund_refunded__subject', ct.__meta.locale, {
        performance_name: invoice.ticket.performance.name
      }),
      content: providers.i18n.translate('@@email.user.refund_refunded__content', ct.__meta.locale, {
        user_username: invoice.user.username,
        host_name: invoice.host.name,
        invoice_id: invoice._id,
        last_4: invoice.payment_method.last4,
        card_brand: pipes.cardBrand(invoice.payment_method.brand),
        invoice_amount: i18n.money(invoice.amount, invoice.currency),
        performance_name: invoice.ticket.performance.name,
        refund_reason: pipes.refundReason(refund.request_reason)
      }),
      from: Env.EMAIL_ADDRESS,
      to: invoice.user.email_address,
      markdown: true,
      attachments: []
    });
  },

  requestStripeRefund: async (ct: Contract<'refund.initiated'>) => {
    const invoice = await Invoice.findOne({
      where: {
        _id: ct.invoice_id
      }
    });

    providers.stripe.connection.refunds.create(
      {
        payment_intent: invoice.stripe_payment_intent_id
      },
      {
        stripeAccount: invoice.host.stripe_account_id
      }
    );
  },

  processBulkRefunds: async (ct: Contract<'refund.bulk'>) => {
    const invoices = await Invoice.find({
      relations: {
        ticket: {
          performance: true
        },
        host: true,
        user: true
      },
      where: {
        _id: In(ct.invoice_ids)
      }
    });

    const refundQuantity = invoices.length;

    //Check all invoices are the same currency, error if not

    if (!invoices.every(i => i.currency === invoices[0].currency))
      throw new ErrorHandler(HTTP.Forbidden, 'All refunds must be in the same currency');

    const invoicesTotal = i18n.money(
      invoices.reduce((acc, curr) => ((acc += +curr.amount), acc), 0),
      invoices[0].currency
    );

    //Send bulk refund initiation email to host
    queues.send_email.add({
      subject: providers.i18n.translate('@@email.host.refund_bulk_initiated_subject', ct.__meta.locale, {
        refund_quantity: refundQuantity
      }),
      content: providers.i18n.translate('@@email.host.refund_bulk_initiated_content', ct.__meta.locale, {
        host_name: invoices[0].host.name,
        refund_quantity: refundQuantity,
        invoices_total: invoicesTotal
      }),
      from: Env.EMAIL_ADDRESS,
      to: invoices[0].host.email_address,
      markdown: true,
      attachments: []
    });

    //Initiate individual refund jobs

    await Promise.all(
      invoices.map(async invoice => {
        await providers.bus.publish(
          'refund.initiated',
          { invoice_id: invoice._id, user_id: invoice.user._id },
          ct.__meta.locale
        );
      })
    );
  },

  unsubscribeAllPatronTierSubscribers: async (ct: Contract<'patronage.tier_deleted'>) => {
    // For all active subscribers of this subscription, emit the "user.unsubscribe_from_patron_tier" command
    // onto the event bus - each one must be processed separately, otherwise we may get 1/2 way through all
    // subscriptions and crash, leaving the other 1/2 of users subscribed
    const tier = await PatronTier.findOne({
      where: { _id: ct.tier_id },
      relations: ['host'],
      options: { withDeleted: true }
    });

    await providers.orm.connection
      .createQueryBuilder(PatronSubscription, 'sub')
      .where('sub.patron_tier = :tier_id', { tier_id: ct.tier_id })
      .andWhere('sub.status = :status', { status: PatronSubscriptionStatus.Active })
      .innerJoinAndSelect('sub.user', 'user')
      .withDeleted() // patron tier is soft deleted at this point
      .iterate(async row => {
        await providers.bus.publish(
          'patronage.unsubscribe_user',
          { sub_id: row.sub__id, user_id: row.user__id },
          row.user_locale
        );

        // Notify the user that they have been unsubscribed due to the tier being deleted
        await queues.send_email.add({
          from: Env.EMAIL_ADDRESS,
          to: row.user_email_address,
          subject: providers.i18n.translate('@@email.subscriber_notify_tier_deleted__subject', row.user_locale),
          content: providers.i18n.translate('@@email.subscriber_notify_tier_deleted__content', row.user_locale, {
            // streaming rows delivers them as one big fat flat untyped json object :(
            sub_id: row.sub__id,
            user_username: row.user_username,
            host_username: row.tier_host_username,
            tier_name: row.tier_name
          }),
          markdown: true,
          attachments: []
        });
      });
  },

  unsubscribeFromPatronTier: async (ct: Contract<'patronage.unsubscribe_user'>) => {
    const sub = await PatronSubscription.findOne({
      where: { _id: ct.sub_id },
      relations: { host: true },
      select: { _id: true, stripe_subscription_id: true, host: { _id: true, stripe_account_id: true } },
      options: { withDeleted: true }
    });

    console.log(sub);

    // Initialise the un-subscription process, Stripe will send a webhook on completion
    // We then emit and event "user.unsubscribed_from_patron_tier" - and another handler will react to that
    // setting the nessecary states & adding a job to the queue for an email notification
    await providers.stripe.connection.subscriptions.del(sub.stripe_subscription_id, {
      stripeAccount: sub.host.stripe_account_id
    });
  },

  sendUserUnsubscribedConfirmationEmail: async (ct: Contract<'patronage.user_unsubscribed'>) => {
    // Have to use QB for softDeleted relation
    const sub = await providers.orm.connection
      .createQueryBuilder(PatronSubscription, 'sub')
      .where('sub._id = :sub_id', { sub_id: ct.sub_id })
      .innerJoinAndSelect('sub.host', 'host')
      .innerJoinAndSelect('sub.patron_tier', 'tier')
      .innerJoinAndSelect('sub.user', 'user')
      .withDeleted()
      .getOne();

    console.log(sub);

    sub.status = PatronSubscriptionStatus.Cancelled;
    sub.cancelled_at = timestamp();
    await sub.save();

    // Notify the user that they have been unsubscribed
    await queues.send_email.add({
      from: Env.EMAIL_ADDRESS,
      to: sub.user.email_address,
      subject: providers.i18n.translate('@@email.user_unsubscribed_from_patron_tier__subject', sub.user.locale),
      content: providers.i18n.translate('@@email.user_unsubscribed_from_patron_tier__content', sub.user.locale, {
        user_username: sub.user.username,
        host_username: sub.host.username,
        tier_name: sub.patron_tier.name
      }),
      markdown: true,
      attachments: []
    });
  },

  transferAllTierSubscribersToNewTier: async (ct: Contract<'patronage.tier_amount_changed'>) => {
    // for each existing subscriber to the old tier, we need to move them over to the new tier which has the new price
    const tier = await PatronTier.findOne({ _id: ct.new_tier_id });
    const host = await Host.findOne({ _id: tier.host__id });

    await providers.orm.connection
      .createQueryBuilder(PatronSubscription, 'sub')
      .where('sub.patron_tier = :tier_id', { tier_id: ct.old_tier_id })
      .andWhere('sub.status = :status', { status: PatronSubscriptionStatus.Active })
      .innerJoinAndSelect('sub.user', 'user')
      .withDeleted() // patron tier is soft deleted at this point
      .iterate(async row => {
        const stripeSubscriptionId = row.sub_stripe_subscription_id;

        const subscription = await providers.stripe.connection.subscriptions.retrieve(stripeSubscriptionId, {
          stripeAccount: host.stripe_account_id
        });

        // https://stripe.com/docs/billing/subscriptions/upgrade-downgrade#changing
        await providers.stripe.connection.subscriptions.update(
          stripeSubscriptionId,
          {
            cancel_at_period_end: false,
            proration_behavior: 'create_prorations',
            items: [
              {
                id: subscription.items.data[0].id,
                price: tier.stripe_price_id
              }
            ]
          },
          { stripeAccount: host.stripe_account_id }
        );

        // update relation of present subscription tier
        await PatronSubscription.update({ _id: row.sub__id }, { patron_tier: tier });
      });
  }
});
