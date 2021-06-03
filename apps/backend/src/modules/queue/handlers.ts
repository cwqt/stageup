import Env from '@backend/env';
import { Host, Invoice, PatronSubscription, PatronTier, Performance, transact, User } from '@core/api';
import { dateOrdinal, i18n, stringifyRichText, timestamp } from '@core/helpers';
import { CurrencyCode, PatronSubscriptionStatus } from '@core/interfaces';
import dbless from 'dbless-email-verification';
import { Contract } from 'libs/shared/src/api/event-bus/contracts';
import moment from 'moment';
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
      content: providers.i18n.translate('@@email.user.invited_to_private_showing__content', ct.__meta.locale, {
        url: performanceLink,
        receipt_url: invoice.stripe_receipt_url,
        user_name: user.name || user.username,
        ticket_name: invoice.ticket.name,
        performance_name: invoice.ticket.performance.name,
        host_name: invoice.ticket.performance.host.name || invoice.ticket.performance.host.username,
        amount: i18n.money(invoice.amount, invoice.currency)
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
          description: stringifyRichText([
            { insert: providers.i18n.translate(`@@host.example_patron_tier_description`, ct.__meta.locale) }
          ]),
          amount: 1000, // 10 GBP
          currency: CurrencyCode.GBP
        },
        host
      );

      await tier.setup(providers.stripe.connection, txc);
    });
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
  }
});
