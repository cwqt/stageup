import Env from '@backend/env';
import {
  Consentable,
  ErrorHandler,
  Host,
  Invoice,
  PatronSubscription,
  PatronTier,
  Performance,
  Refund,
  Ticket,
  transact,
  User,
  UserHostMarketingConsent
} from '@core/api';
import { dateOrdinal, i18n, pipes, richtext, timestamp, timeout, unix } from '@core/helpers';

import { BulkRefundReason, CurrencyCode, HTTP, PatronSubscriptionStatus } from '@core/interfaces';
import dbless from 'dbless-email-verification';
// FOR SENDING EMAILS: ----------------------------------------------------------
// define the event & contract that goes along with it
// emit the event & contract data on onto the event bus
// setup a listener in one of the modules for that event
// write an event handler, that will do something with the event
//   - for emails, write the email in english in the i18n.hjson file
//   - reference the i18n token in the this.providers.i18n.translate
//   - add all the variables in the .translate that are in the ICU string {username}
//   - add the email to the send_email queue for the workers to process at some later date (immediately)
// ------------------------------------------------------------------------------
import { Contract } from 'libs/shared/src/api/event-bus/contracts';
import moment from 'moment';
import { In } from 'typeorm';
import { InvoiceService } from '../invoice/invoice.service';
import { QueueModule, QueueProviders } from './queue.module';

export class EventHandlers {
  constructor(
    private queues: QueueModule['queues'],
    private providers: QueueProviders,
    private invoiceService: InvoiceService
  ) {}

  sendTestEmail = async (ct: Contract<'test.send_email'>) => {
    const user = await User.findOne({ _id: ct.user_id }, { select: ['email_address', 'username', 'name'] });
    this.queues.send_email.add({
      subject: this.providers.i18n.translate('@@email.test.send_email__subject', ct.__meta.locale),
      content: this.providers.i18n.translate('@@email.test.send_email__content', ct.__meta.locale, {
        username: user.username,
        url: Env.FRONTEND.URL
      }),
      from: Env.EMAIL_ADDRESS,
      to: user.email_address,
      attachments: []
    });
  };

  sendUserVerificationEmail = async (ct: Contract<'user.registered'>) => {
    const hash = dbless.generateVerificationHash(ct.email_address, Env.PRIVATE_KEY, 60);
    const verificationUrl = `${Env.BACKEND.URL}/auth/verify-email?email_address=${ct.email_address}&hash=${hash}`;

    this.queues.send_email.add({
      subject: this.providers.i18n.translate('@@email.user.registered__subject', ct.__meta.locale),
      content: this.providers.i18n.translate('@@email.user.registered__content', ct.__meta.locale, {
        url: verificationUrl
      }),
      from: Env.EMAIL_ADDRESS,
      to: ct.email_address,
      attachments: []
    });
  };

  sendUserHostInviteEmail = async (ct: Contract<'user.invited_to_host'>) => {
    // Re_direct to frontend which will then send a request to backend host landing page
    const acceptanceUrl = `${Env.BACKEND.URL}/hosts/${ct.host_id}/invites/${ct.invite_id}`;

    const inviter = await User.findOne({ _id: ct.inviter_id }, { select: ['email_address', 'username', 'name'] });
    const invitee = await User.findOne({ _id: ct.invitee_id }, { select: ['email_address', 'username', 'name'] });
    const host = await Host.findOne({ _id: ct.host_id }, { select: ['username', 'name'] });

    this.queues.send_email.add({
      subject: this.providers.i18n.translate('@@email.user.invited_to_host__subject', ct.__meta.locale, {
        inviter_name: inviter.name || inviter.username,
        host_name: host.username
      }),
      content: this.providers.i18n.translate('@@email.user.invited_to_host__content', ct.__meta.locale, {
        user_name: invitee.name || invitee.username,
        url: acceptanceUrl
      }),
      from: Env.EMAIL_ADDRESS,
      to: invitee.email_address,
      attachments: []
    });
  };

  sendUserPrivatePerformanceInviteEmail = async (ct: Contract<'user.invited_to_private_showing'>) => {
    const user = await User.findOne({ _id: ct.user_id }, { select: ['email_address', 'username', 'name'] });
    const performance = await Performance.findOne({ _id: ct.performance_id }, { select: ['name'] });
    const host = await Host.findOne({ _id: ct.host_id }, { select: ['username', 'name'] });
    const performanceLink = `${Env.FRONTEND.URL}/${ct.__meta.locale}}/performances/${performance._id}/watch`;

    this.queues.send_email.add({
      subject: this.providers.i18n.translate('@@email.user.invited_to_private_showing__subject', ct.__meta.locale),
      content: this.providers.i18n.translate('@@email.user.invited_to_private_showing__content', ct.__meta.locale, {
        url: performanceLink,
        user_name: user.name || user.username,
        performance_name: performance.name,
        host_name: host.name || host.username
      }),
      from: Env.EMAIL_ADDRESS,
      to: user.email_address,
      attachments: []
    });
  };

  sendTicketReceiptEmail = async (ct: Contract<'ticket.purchased'>) => {
    const user = await User.findOne({ _id: ct.purchaser_id }, { select: ['email_address', 'username', 'name'] });
    const invoice = await Invoice.findOne(
      { _id: ct.invoice_id },
      { relations: { ticket: { performance: { host: true } } } }
    );
    // The performance is currently available if the current timestamp is after the publicity period start and before the end
    // Discussed with Shreya who said that new wireframes will show the whole period on the event creation dialog as opposed to premiere_datetime
    const performanceIsAvailable =
      invoice.ticket.performance.publicity_period.start <= timestamp() &&
      timestamp() < invoice.ticket.performance.publicity_period.end;

    const link = performanceIsAvailable
      ? `${Env.FRONTEND.URL}/${ct.__meta.locale.language}/performances/${invoice.ticket.performance._id}/watch`
      : `${Env.FRONTEND.URL}/${ct.__meta.locale.language}/my-stuff`;

    if (performanceIsAvailable) {
      this.queues.send_email.add({
        subject: this.providers.i18n.translate('@@email.ticket.purchased_current__subject', ct.__meta.locale, {
          performance_name: invoice.ticket.performance.name
        }),
        content: this.providers.i18n.translate('@@email.ticket.purchased_current__content', ct.__meta.locale, {
          receipt_url: invoice.stripe_receipt_url,
          user_name: user.name || user.username,
          ticket_name: invoice.ticket.name,
          performance_name: invoice.ticket.performance.name,
          amount: i18n.money(invoice.amount, invoice.currency),
          url: link
        }),
        from: Env.EMAIL_ADDRESS,
        to: user.email_address,
        markdown: true,
        attachments: []
      });
    } else {
      this.queues.send_email.add({
        subject: this.providers.i18n.translate('@@email.ticket.purchased_future__subject', ct.__meta.locale, {
          performance_name: invoice.ticket.performance.name
        }),
        content: this.providers.i18n.translate('@@email.ticket.purchased_future__content', ct.__meta.locale, {
          receipt_url: invoice.stripe_receipt_url,
          user_name: user.name || user.username,
          performance_name: invoice.ticket.performance.name,
          premier_time: i18n.date(unix(invoice.ticket.performance.premiere_datetime), ct.__meta.locale),
          amount: i18n.money(invoice.amount, invoice.currency),
          url: link
        }),
        from: Env.EMAIL_ADDRESS,
        to: user.email_address,
        markdown: true,
        attachments: []
      });
    }
  };

  sendHostPatronSubscriptionStartedEmail = async (ct: Contract<'patronage.started'>) => {
    const user = await User.findOne({ _id: ct.user_id }, { select: ['email_address', 'name', 'username'] });
    const tier = await PatronTier.findOne({ _id: ct.tier_id }, { relations: ['host'] });
    this.queues.send_email.add({
      subject: this.providers.i18n.translate('@@email.host.patronage_started__subject', ct.__meta.locale, {
        tier_name: tier.name
      }),
      content: this.providers.i18n.translate('@@email.host.patronage_started__content', ct.__meta.locale, {
        tier_name: tier.name,
        user_username: user.username,
        host_name: tier.host.name || tier.host.username,
        amount: i18n.money(tier.amount, tier.currency)
      }),
      from: Env.EMAIL_ADDRESS,
      to: tier.host.email_address,
      attachments: []
    });
  };

  deletePerformance = async (ct: Contract<'performance.deleted'>) => {
    const performance = await this.providers.orm.connection
      .createQueryBuilder(Performance, 'performance')
      .where('performance._id = :pid', { pid: ct.performance_id })
      .innerJoin('performance.host', 'host')
      .addSelect(['host.name', 'host.email_address'])
      .withDeleted()
      .getOne();

    //Send host email notifcation
    this.queues.send_email.add({
      subject: this.providers.i18n.translate('@@email.performance.deleted_notify_host__subject', ct.__meta.locale, {
        performance_name: performance.name
      }),
      content: this.providers.i18n.translate('@@email.performance.deleted_notify_host__content', ct.__meta.locale, {
        host_name: performance.host.name,
        performance_name: performance.name,
        performance_premiere_date: moment.unix(performance.premiere_datetime).format('LLLL')
      }),
      from: Env.EMAIL_ADDRESS,
      to: performance.host.email_address,
      markdown: true,
      attachments: []
    });

    //Find all users who've bought tickets and fire Performance.deleted_notify_user for each invoice
    //First, return all tickets for a perf
    const tickets: Ticket[] = await this.providers.orm.connection
      .createQueryBuilder(Ticket, 'ticket')
      .select(['ticket._id', 'performance__id'])
      .where('ticket.performance__id = :performance_id', { performance_id: ct.performance_id })
      .getMany();

    //Create an array of ticket ids
    const ticketIds: string[] = tickets.map(t => t._id);

    //Then, get all invoices with those tickets referenced
    const invoices: Invoice[] = await this.providers.orm.connection
      .createQueryBuilder(Invoice, 'invoice')
      .select(['invoice._id', 'invoice.ticket__id'])
      .where('invoice.ticket__id IN (:...ticket_ids)', { ticket_ids: ticketIds })
      .innerJoin('invoice.user', 'user')
      .addSelect('user._id')
      .getMany();

    //Get array of invoice ids
    const invoiceIds: string[] = invoices.map(invoice => invoice._id);

    //Then refund those invoices
    this.invoiceService.processRefunds({
      host_id: performance.host._id,
      invoice_ids: invoiceIds,
      bulk_refund_data: {
        bulk_refund_reason: BulkRefundReason.PerformanceDeletedAutoRefund,
        bulk_refund_detail: null
      }
    });

    //Fire off user email event for each invoice
    invoices.map(async i => {
      return await this.providers.bus.publish(
        'performance.deleted_notify_user',
        {
          performance_id: ct.performance_id,
          user_id: i.user._id,
          invoice_id: i._id
        },
        ct.__meta.locale
      );
    });
  };

  sendUserPerformanceDeletionEmail = async (ct: Contract<'performance.deleted_notify_user'>) => {
    const perf: Performance = await this.providers.orm.connection
      .createQueryBuilder(Performance, 'performance')
      .select(['performance.name'])
      .where('performance._id = :performance_id', { performance_id: ct.performance_id })
      .innerJoin('performance.host', 'host')
      .addSelect('host.name')
      .withDeleted()
      .getOne();

    const user = await User.findOne({ _id: ct.user_id }, { select: ['name', 'email_address'] });

    const invoice = await this.providers.orm.connection
      .createQueryBuilder(Invoice, 'invoice')
      .select(['invoice._id', 'invoice.amount', 'invoice.purchased_at', 'invoice.currency'])
      .where('invoice._id = :invoice_id', { invoice_id: ct.invoice_id })
      .innerJoin('invoice.payment_method', 'payment_method')
      .addSelect(['payment_method.brand', 'payment_method.last4'])
      .getOne();

    //Send user email notifcation
    this.queues.send_email.add({
      subject: this.providers.i18n.translate('@@email.performance.deleted_notify_user__subject', ct.__meta.locale, {
        performance_name: perf.name
      }),
      content: this.providers.i18n.translate('@@email.performance.deleted_notify_user__content', ct.__meta.locale, {
        user_username: user.name,
        host_name: perf.host.name,
        performance_name: perf.name,
        invoice_id: invoice._id,
        ticket_purchase_date: moment.unix(invoice.purchased_at).format('LLLL'),
        ticket_amount: i18n.money(invoice.amount, invoice.currency),
        card_brand: pipes.cardBrand(invoice.payment_method.brand),
        last_4: invoice.payment_method.last4
      }),
      from: Env.EMAIL_ADDRESS,
      to: user.email_address,
      markdown: true,
      attachments: []
    });
  };

  sendUserPatronSubscriptionStartedReceiptEmail = async (ct: Contract<'patronage.started'>) => {
    const user = await User.findOne({ _id: ct.user_id }, { select: ['email_address', 'name', 'username'] });
    const tier = await PatronTier.findOne({ _id: ct.tier_id }, { relations: ['host'] });

    this.queues.send_email.add({
      subject: this.providers.i18n.translate('@@email.user.patronage_started__subject', ct.__meta.locale, {
        tier_name: tier.name
      }),
      content: this.providers.i18n.translate('@@email.user.patronage_started__content', ct.__meta.locale, {
        user_name: user.name || user.username,
        host_name: tier.host.name || tier.host.username,
        date_ordinal: dateOrdinal(new Date(), true),
        tos_url: `${Env.FRONTEND.URL}/${ct.__meta.locale}}/terms_of_service`,
        amount: i18n.money(tier.amount, tier.currency)
      }),
      from: Env.EMAIL_ADDRESS,
      to: user.email_address,
      attachments: []
    });
  };

  sendPasswordResetLinkEmail = async (ct: Contract<'user.password_reset_requested'>) => {
    const user = await User.findOne({ _id: ct.user_id }, { select: ['_id', 'email_address'] });

    this.queues.send_email.add({
      subject: this.providers.i18n.translate('@@email.user.password_reset_requested__subject', ct.__meta.locale),
      content: this.providers.i18n.translate('@@email.user.password_reset_requested__content', ct.__meta.locale),
      from: Env.EMAIL_ADDRESS,
      to: user.email_address,
      attachments: []
    });
  };

  sendPasswordChangedNotificationEmail = async (ct: Contract<'user.password_changed'>) => {
    const user = await User.findOne({ _id: ct.user_id }, { select: ['_id', 'email_address'] });

    this.queues.send_email.add({
      subject: this.providers.i18n.translate('@@email.user.password_changed__subject', ct.__meta.locale),
      content: this.providers.i18n.translate('@@email.user.password_changed__content', ct.__meta.locale),
      from: Env.EMAIL_ADDRESS,
      to: user.email_address,
      attachments: []
    });
  };

  sendHostRefundRequestEmail = async (ct: Contract<'refund.requested'>) => {
    const invoice = await Invoice.findOne(
      { _id: ct.invoice_id },
      { relations: { user: true, ticket: { performance: true }, host: true } }
    );

    this.queues.send_email.add({
      subject: this.providers.i18n.translate('@@email.host_refund_requested_confirmation__subject', ct.__meta.locale, {
        performance_name: invoice.ticket.performance.name,
        user_username: invoice.user.username
      }),

      content: this.providers.i18n.translate('@@email.host_refund_requested_confirmation__content', ct.__meta.locale, {
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
      attachments: []
    });
  };

  sendInvoiceRefundRequestConfirmation = async (ct: Contract<'refund.requested'>) => {
    // FUTURE Have different strategies for different types of purchaseables?
    const invoice = await Invoice.findOne(
      { _id: ct.invoice_id },
      { relations: { user: true, ticket: { performance: true }, host: true } }
    );

    this.queues.send_email.add({
      subject: this.providers.i18n.translate('@@email.refund_requested__subject', ct.__meta.locale, {
        host_name: invoice.host.username
      }),
      content: this.providers.i18n.translate('@@email.refund_requested__content', ct.__meta.locale, {
        host_name: invoice.host.name,
        invoice_id: invoice._id,
        performance_name: invoice.ticket.performance.name,
        purchase_date: moment.unix(invoice.purchased_at).format('LLLL'),
        amount: i18n.money(invoice.amount, invoice.currency)
      }),
      from: Env.EMAIL_ADDRESS,
      to: invoice.user.email_address,
      attachments: []
    });
  };

  setupDefaultPatronTierForHost = async (ct: Contract<'host.stripe_connected'>) => {
    await transact(async txc => {
      const host = await Host.findOne({ _id: ct.host_id });
      const tier = new PatronTier(
        {
          name: this.providers.i18n.translate('@@host.example_patron_tier_name', ct.__meta.locale),
          description: richtext.read(
            richtext.create(this.providers.i18n.translate(`@@host.example_patron_tier_description`, ct.__meta.locale))
          ),
          amount: 1000, // 10 GBP
          currency: CurrencyCode.GBP
        },
        host
      );

      await tier.setup(this.providers.stripe.connection, txc);
    });
  };

  sendHostRefundInitiatedEmail = async (ct: Contract<'refund.initiated'>) => {
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

    this.queues.send_email.add({
      subject: this.providers.i18n.translate('@@email.host.refund_initiated__subject', ct.__meta.locale, {
        user_username: user.username,
        performance_name: invoice.ticket.performance.name
      }),
      content: this.providers.i18n.translate('@@email.host.refund_initiated__content', ct.__meta.locale, {
        host_name: invoice.host.name,
        performance_name: invoice.ticket.performance.name,
        invoice_id: invoice._id,
        invoice_amount: i18n.money(invoice.amount, invoice.currency)
      }),
      from: Env.EMAIL_ADDRESS,
      to: user.email_address,
      attachments: []
    });
  };

  sendUserRefundInitiatedEmail = async (ct: Contract<'refund.initiated'>) => {
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

    this.queues.send_email.add({
      subject: this.providers.i18n.translate('@@email.user.refund_initiated__subject', ct.__meta.locale, {
        host_name: invoice.host.name,
        performance_name: invoice.ticket.performance.name
      }),
      content: this.providers.i18n.translate('@@email.user.refund_initiated__content', ct.__meta.locale, {
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
      attachments: []
    });
  };

  sendHostRefundRefundedEmail = async (ct: Contract<'refund.refunded'>) => {
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

    this.queues.send_email.add({
      subject: this.providers.i18n.translate('@@email.host.refund_refunded__subject', ct.__meta.locale, {
        invoice_id: invoice._id,
        user_username: invoice.user.username,
        performance_name: invoice.ticket.performance.name
      }),
      content: this.providers.i18n.translate('@@email.host.refund_refunded__content', ct.__meta.locale, {
        host_name: invoice.host.name,
        user_username: invoice.user.username,
        performance_name: invoice.ticket.performance.name,
        invoice_amount: i18n.money(invoice.amount, invoice.currency)
      }),
      from: Env.EMAIL_ADDRESS,
      to: invoice.host.email_address,
      attachments: []
    });
  };

  sendUserRefundRefundedEmail = async (ct: Contract<'refund.refunded'>) => {
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

    this.queues.send_email.add({
      subject: this.providers.i18n.translate('@@email.user.refund_refunded__subject', ct.__meta.locale, {
        performance_name: invoice.ticket.performance.name
      }),
      content: this.providers.i18n.translate('@@email.user.refund_refunded__content', ct.__meta.locale, {
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
      attachments: []
    });
  };

  enactStripeRefund = async (ct: Contract<'refund.initiated'>) => {
    console.log('in requeststriperefund');
    const invoice = await this.providers.orm.connection
      .createQueryBuilder(Invoice, 'i')
      .where('i._id = :_id', { _id: ct.invoice_id })
      .leftJoinAndSelect('i.host', 'host')
      .getOne();

    await this.providers.stripe.connection.refunds.create(
      {
        payment_intent: invoice.stripe_payment_intent_id
      },
      {
        stripeAccount: invoice.host.stripe_account_id
      }
    );
  };

  processBulkRefunds = async (ct: Contract<'refund.bulk'>) => {
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
      //TODO remove this error when multi currency implemented
      throw new ErrorHandler(HTTP.Forbidden, 'All refunds must be in the same currency');

    const invoicesTotal = i18n.money(
      invoices.reduce((acc, curr) => ((acc += +curr.amount), acc), 0),
      invoices[0].currency
    );

    //Send bulk refund initiation email to host
    this.queues.send_email.add({
      subject: this.providers.i18n.translate('@@email.host.refund_bulk_initiated_subject', ct.__meta.locale, {
        refund_quantity: refundQuantity
      }),
      content: this.providers.i18n.translate('@@email.host.refund_bulk_initiated_content', ct.__meta.locale, {
        host_name: invoices[0].host.name,
        refund_quantity: refundQuantity,
        invoices_total: invoicesTotal
      }),
      from: Env.EMAIL_ADDRESS,
      to: invoices[0].host.email_address, //TODO need to change this when we go multi currency
      attachments: []
    });

    //Initiate individual refund jobs

    await Promise.all(
      invoices.map(async invoice => {
        await this.providers.bus.publish(
          'refund.initiated',
          { invoice_id: invoice._id, user_id: invoice.user._id },
          ct.__meta.locale
        );
      })
    );
  };

  unsubscribeAllPatronTierSubscribers = async (ct: Contract<'patronage.tier_deleted'>) => {
    // For all active subscribers of this subscription, emit the "user.unsubscribe_from_patron_tier" command
    // onto the event bus - each one must be processed separately, otherwise we may get 1/2 way through all
    // subscriptions and crash, leaving the other 1/2 of users subscribed
    const tier = await PatronTier.findOne({
      where: { _id: ct.tier_id },
      relations: ['host'],
      options: { withDeleted: true }
    });

    await this.providers.orm.connection
      .createQueryBuilder(PatronSubscription, 'sub')
      .where('sub.patron_tier = :tier_id', { tier_id: ct.tier_id })
      .andWhere('sub.status = :status', { status: PatronSubscriptionStatus.Active })
      .innerJoinAndSelect('sub.user', 'user')
      .withDeleted() // patron tier is soft deleted at this point
      .iterate(async row => {
        await this.providers.bus.publish(
          'patronage.unsubscribe_user',
          { sub_id: row.sub__id, user_id: row.user__id },
          row.user_locale
        );

        // Notify the user that they have been unsubscribed due to the tier being deleted
        await this.queues.send_email.add({
          from: Env.EMAIL_ADDRESS,
          to: row.user_email_address,
          subject: this.providers.i18n.translate('@@email.subscriber_notify_tier_deleted__subject', row.user_locale),
          content: this.providers.i18n.translate('@@email.subscriber_notify_tier_deleted__content', row.user_locale, {
            // streaming rows delivers them as one big fat flat untyped json object :(
            sub_id: row.sub__id,
            user_username: row.user_username,
            host_username: row.tier_host_username,
            tier_name: row.tier_name
          }),
          attachments: []
        });
      });
  };

  unsubscribeFromPatronTier = async (ct: Contract<'patronage.unsubscribe_user'>) => {
    const sub = await PatronSubscription.findOne({
      where: { _id: ct.sub_id },
      relations: { host: true },
      select: { _id: true, stripe_subscription_id: true, host: { _id: true, stripe_account_id: true } },
      options: { withDeleted: true }
    });

    // Initialise the un-subscription process, Stripe will send a webhook on completion
    // We then emit and event "user.unsubscribed_from_patron_tier" - and another handler will react to that
    // setting the nessecary states & adding a job to the queue for an email notification
    await this.providers.stripe.connection.subscriptions.del(sub.stripe_subscription_id, {
      stripeAccount: sub.host.stripe_account_id
    });
  };

  sendUserUnsubscribedConfirmationEmail = async (ct: Contract<'patronage.user_unsubscribed'>) => {
    // Have to use QB for softDeleted relation
    const sub = await this.providers.orm.connection
      .createQueryBuilder(PatronSubscription, 'sub')
      .where('sub._id = :sub_id', { sub_id: ct.sub_id })
      .innerJoinAndSelect('sub.host', 'host')
      .innerJoinAndSelect('sub.patron_tier', 'tier')
      .innerJoinAndSelect('sub.user', 'user')
      .withDeleted()
      .getOne();

    sub.status = PatronSubscriptionStatus.Cancelled;
    sub.cancelled_at = timestamp();
    await sub.save();

    // Notify the user that they have been unsubscribed
    await this.queues.send_email.add({
      from: Env.EMAIL_ADDRESS,
      to: sub.user.email_address,
      subject: this.providers.i18n.translate('@@email.user_unsubscribed_from_patron_tier__subject', sub.user.locale),
      content: this.providers.i18n.translate('@@email.user_unsubscribed_from_patron_tier__content', sub.user.locale, {
        user_username: sub.user.username,
        host_username: sub.host.username,
        tier_name: sub.patron_tier.name
      }),
      attachments: []
    });
  };

  sendPerformanceReminderEmails = async (ct: Contract<'performance.created'>) => {
    const performance = await Performance.findOne({ _id: ct._id });
    const premierDate = performance.premiere_datetime;
    if (!premierDate) return; // TODO: This will instead be based on publicity_period.start in the future (which will be a compulsory field)
    const oneDayPrior = premierDate - 86400 - timestamp(); // 86400 is the number of seconds in 24 hours
    const fifteenMinutesPrior = premierDate - 900 - timestamp(); // 900 is the number of seconds in 15 minutes
    const url = `${Env.FRONTEND.URL}/${ct.__meta.locale.language}/my-stuff`; // URL to direct the user to in the email

    // Need to send off 2 different jobs, one 1 day before and one for 15 minutes before performance premier date
    // Only queue emails if the 'send' date is in the future.
    if (oneDayPrior > 0)
      await this.queues.send_reminder_emails.add(
        {
          performance_id: ct._id,
          sender_email_address: Env.EMAIL_ADDRESS,
          type: '24 hours',
          premier_date: premierDate,
          url: `${Env.FRONTEND.URL}/${ct.__meta.locale.language}/my-stuff`
        },
        {
          // delay: 1000 * 2 * 60 // used for testing (sends in 2 minutes)
          delay: 1000 * oneDayPrior // multiply by 1000 to get time in milliseconds
        }
      );
    if (fifteenMinutesPrior > 0)
      await this.queues.send_reminder_emails.add(
        {
          performance_id: ct._id,
          sender_email_address: Env.EMAIL_ADDRESS,
          type: '15 minutes',
          premier_date: premierDate,
          url: `${Env.FRONTEND.URL}/${ct.__meta.locale.language}/performances/${ct._id}`
        },
        {
          // delay: 1000 * 3 * 60 // used for testing (sends in 3 minutes)
          delay: 1000 * fifteenMinutesPrior // multiply by 1000 to get time in milliseconds
        }
      );
  };

  transferAllTierSubscribersToNewTier = async (ct: Contract<'patronage.tier_amount_changed'>) => {
    // for each existing subscriber to the old tier, we need to move them over to the new tier which has the new price
    const tier = await PatronTier.findOne({ _id: ct.new_tier_id });
    const host = await Host.findOne({ _id: tier.host__id });

    await this.providers.orm.connection
      .createQueryBuilder(PatronSubscription, 'sub')
      .where('sub.patron_tier = :tier_id', { tier_id: ct.old_tier_id })
      .andWhere('sub.status = :status', { status: PatronSubscriptionStatus.Active })
      .innerJoinAndSelect('sub.user', 'user')
      .withDeleted() // patron tier is soft deleted at this point
      .iterate(async row => {
        const stripeSubscriptionId = row.sub_stripe_subscription_id;

        const subscription = await this.providers.stripe.connection.subscriptions.retrieve(stripeSubscriptionId, {
          stripeAccount: host.stripe_account_id
        });

        // https://stripe.com/docs/billing/subscriptions/upgrade-downgrade#changing
        await this.providers.stripe.connection.subscriptions.update(
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
  };

  createPerformanceAnalyticsCollectionJob = async (ct: Contract<'performance.created'>) => {
    // Collect analytics for this performance once per week at 0:00
    await this.queues.collect_performance_analytics.add(
      { performance_id: ct._id },
      {
        repeat: { every: 604800000 } // 7 days in milliseconds
      }
    );
  };

  createHostAnalyticsCollectionJob = async (ct: Contract<'host.created'>) => {
    // Collect analytics for this performance once per week at 0:00
    await this.queues.collect_host_analytics.add(
      { host_id: ct.host_id },
      {
        repeat: { every: 604800000 } // 7 days in milliseconds
      }
    );
  };

  setUserHostMarketingOptStatus = async (ct: Contract<'ticket.purchased'>) => {
    // check if already consenting to this host, if not then soft-opt in
    const c = await this.providers.orm.connection
      .createQueryBuilder(UserHostMarketingConsent, 'c')
      .where('c.user__id = :uid', { uid: ct.purchaser_id })
      .andWhere('c.host__id = :hid', { hid: ct.host_id })
      .getOne();

    if (c) return;

    // create new consent, using latest policies
    const toc = await Consentable.retrieve({ type: 'general_toc' }, 'latest');
    const privacyPolicy = await Consentable.retrieve({ type: 'privacy_policy' }, 'latest');
    const user = await User.findOne({ _id: ct.purchaser_id });
    const host = await Host.findOne({ _id: ct.host_id });

    const consent = new UserHostMarketingConsent(ct.marketing_consent, host, user, toc, privacyPolicy);
    await consent.save();
  };
}
