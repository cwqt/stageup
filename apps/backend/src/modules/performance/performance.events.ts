import Env from '@backend/env';
import { AUTOGEN_i18n_TOKEN_MAP } from '@backend/i18n/i18n-tokens.autogen';
import {
  Consentable,
  EventBus,
  EVENT_BUS_PROVIDER,
  Host,
  Invoice,
  ModuleEvents,
  Performance,
  PostgresProvider,
  POSTGRES_PROVIDER,
  Ticket,
  User,
  UserHostMarketingConsent,
  combine,
  Contract,
  I18N_PROVIDER,
  i18n
} from '@core/api';
import { pipes, timestamp, unix } from '@core/helpers';
import { BulkRefundReason, PerformanceStatus } from '@core/interfaces';
import moment from 'moment';
import { Inject, Service } from 'typedi';
import { Connection } from 'typeorm';
import { FinanceService } from '../finance/finance.service';
import { JobQueueService } from '../queue/queue.service';

@Service()
export class PerformanceEvents extends ModuleEvents {
  constructor(
    private financeService: FinanceService,
    private queueService: JobQueueService,
    @Inject(EVENT_BUS_PROVIDER) private bus: EventBus,
    @Inject(POSTGRES_PROVIDER) private ORM: Connection,
    @Inject(I18N_PROVIDER) private i18n: i18n<AUTOGEN_i18n_TOKEN_MAP>
  ) {
    super();
    // prettier-ignore
    this.events = {
     ["performance.created"]: combine([   this.createPerformanceAnalyticsCollectionJob,
                                          this.sendPerformanceReminderEmails]),
     ["performance.deleted"]:             this.deletePerformance,
     ["performance.deleted_notify_user"]: this.sendUserPerformanceDeletionEmail,
     ["ticket.purchased"]:    combine([   this.sendTicketReceiptEmail,
                                          this.setUserHostMarketingOptStatus])
    }
  }

  async createPerformanceAnalyticsCollectionJob(ct: Contract<'performance.created'>) {
    // Collect analytics for this performance once per week at 0:00
    await this.queueService.addJob(
      'collect_performance_analytics',
      { performance_id: ct._id },
      {
        repeat: { every: 604800000 } // 7 days in milliseconds
      }
    );
  }

  async sendPerformanceReminderEmails(ct: Contract<'performance.created'>) {
    const performance = await Performance.findOne({ _id: ct._id });
    const premierDate = performance.premiere_datetime;
    if (!premierDate) return; // TODO: This will instead be based on publicity_period.start in the future (which will be a compulsory field)
    const oneDayPrior = premierDate - 86400 - timestamp(); // 86400 is the number of seconds in 24 hours
    const fifteenMinutesPrior = premierDate - 900 - timestamp(); // 900 is the number of seconds in 15 minutes
    const url = `${Env.FRONTEND.URL}/${ct.__meta.locale.language}/my-stuff`; // URL to direct the user to in the email

    // Need to send off 2 different jobs, one 1 day before and one for 15 minutes before performance premier date
    // Only queue emails if the 'send' date is in the future.
    if (oneDayPrior > 0)
      await this.queueService.addJob(
        'send_reminder_emails',
        {
          performance_id: ct._id,
          sender_email_address: Env.EMAIL_ADDRESS,
          type: '24_HOURS',
          premier_date: premierDate,
          url: `${Env.FRONTEND.URL}/${ct.__meta.locale.language}/my-stuff`
        },
        {
          // delay: 1000 * 2 * 60 // used for testing (sends in 2 minutes)
          delay: 1000 * oneDayPrior // multiply by 1000 to get time in milliseconds
        }
      );
    if (fifteenMinutesPrior > 0)
      await this.queueService.addJob(
        'send_reminder_emails',
        {
          performance_id: ct._id,
          sender_email_address: Env.EMAIL_ADDRESS,
          type: '15_MINUTES',
          premier_date: premierDate,
          url: `${Env.FRONTEND.URL}/${ct.__meta.locale.language}/performances/${ct._id}`
        },
        {
          // delay: 1000 * 3 * 60 // used for testing (sends in 3 minutes)
          delay: 1000 * fifteenMinutesPrior // multiply by 1000 to get time in milliseconds
        }
      );
  }

  async deletePerformance(ct: Contract<'performance.deleted'>) {
    const performance = await this.ORM.createQueryBuilder(Performance, 'performance')
      .where('performance._id = :pid', { pid: ct.performance_id })
      .innerJoin('performance.host', 'host')
      .addSelect(['host.name', 'host.email_address'])
      .withDeleted()
      .getOne();

    //Send host email notifcation
    this.queueService.addJob('send_email', {
      subject: this.i18n.translate('@@email.performance.deleted_notify_host__subject', ct.__meta.locale, {
        performance_name: performance.name
      }),
      content: this.i18n.translate('@@email.performance.deleted_notify_host__content', ct.__meta.locale, {
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
    const tickets: Ticket[] = await this.ORM.createQueryBuilder(Ticket, 'ticket')
      .select(['ticket._id', 'performance__id'])
      .where('ticket.performance__id = :performance_id', { performance_id: ct.performance_id })
      .getMany();

    //Create an array of ticket ids
    const ticketIds: string[] = tickets.map(t => t._id);

    //Check if tickets were created
    if (ticketIds.length > 0) {
      //Then, get all invoices with those tickets referenced
      const invoices: Invoice[] = await this.ORM.createQueryBuilder(Invoice, 'invoice')
        .select(['invoice._id', 'invoice.ticket__id'])
        .where('invoice.ticket__id IN (:...ticket_ids)', { ticket_ids: ticketIds })
        .innerJoin('invoice.user', 'user')
        .addSelect('user._id')
        .getMany();

      //Get array of invoice ids
      const invoiceIds: string[] = invoices.map(invoice => invoice._id);

      //Then refund those invoices
      this.financeService.processRefunds(
        {
          host_id: performance.host._id,
          invoice_ids: invoiceIds,
          bulk_refund_data: {
            bulk_refund_reason: BulkRefundReason.PerformanceDeletedAutoRefund,
            bulk_refund_detail: null
          },
          send_initiation_emails: false
        },
        ct.__meta.locale
      );

      //Fire off user email event for each invoice
      invoices.map(async i => {
        return await this.bus.publish(
          'performance.deleted_notify_user',
          {
            performance_id: ct.performance_id,
            user_id: i.user._id,
            invoice_id: i._id
          },
          ct.__meta.locale
        );
      });
    }

    //Soft delete the performance
    performance.status = PerformanceStatus.Deleted;
    performance.delete_reason = ct.delete_perf_reason;
    performance.save();
    await performance.softRemove();
  }

  async sendUserPerformanceDeletionEmail(ct: Contract<'performance.deleted_notify_user'>) {
    const perf: Performance = await this.ORM.createQueryBuilder(Performance, 'performance')
      .select(['performance.name'])
      .where('performance._id = :performance_id', { performance_id: ct.performance_id })
      .innerJoin('performance.host', 'host')
      .addSelect('host.name')
      .withDeleted()
      .getOne();

    const user = await User.findOne({ _id: ct.user_id }, { select: ['name', 'email_address'] });

    const invoice = await this.ORM.createQueryBuilder(Invoice, 'invoice')
      .select(['invoice._id', 'invoice.amount', 'invoice.purchased_at', 'invoice.currency'])
      .where('invoice._id = :invoice_id', { invoice_id: ct.invoice_id })
      .innerJoin('invoice.payment_method', 'payment_method')
      .addSelect(['payment_method.brand', 'payment_method.last4'])
      .getOne();

    //Send user email notifcation
    this.queueService.addJob('send_email', {
      subject: this.i18n.translate('@@email.performance.deleted_notify_user__subject', ct.__meta.locale, {
        performance_name: perf.name
      }),
      content: this.i18n.translate('@@email.performance.deleted_notify_user__content', ct.__meta.locale, {
        user_username: user.name,
        host_name: perf.host.name,
        performance_name: perf.name,
        invoice_id: invoice._id,
        ticket_purchase_date: moment.unix(invoice.purchased_at).format('LLLL'),
        ticket_amount: this.i18n.money(invoice.amount, invoice.currency),
        card_brand: pipes.cardBrand(invoice.payment_method.brand),
        last_4: invoice.payment_method.last4
      }),
      from: Env.EMAIL_ADDRESS,
      to: user.email_address,
      markdown: true,
      attachments: []
    });
  }

  async sendTicketReceiptEmail(ct: Contract<'ticket.purchased'>) {
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
      this.queueService.addJob('send_email', {
        subject: this.i18n.translate('@@email.ticket.purchased_current__subject', ct.__meta.locale, {
          performance_name: invoice.ticket.performance.name
        }),
        content: this.i18n.translate('@@email.ticket.purchased_current__content', ct.__meta.locale, {
          receipt_url: invoice.stripe_receipt_url,
          user_name: user.name || user.username,
          ticket_name: invoice.ticket.name,
          performance_name: invoice.ticket.performance.name,
          amount: this.i18n.money(invoice.amount, invoice.currency),
          url: link
        }),
        from: Env.EMAIL_ADDRESS,
        to: user.email_address,
        markdown: true,
        attachments: []
      });
    } else {
      this.queueService.addJob('send_email', {
        subject: this.i18n.translate('@@email.ticket.purchased_future__subject', ct.__meta.locale, {
          performance_name: invoice.ticket.performance.name
        }),
        content: this.i18n.translate('@@email.ticket.purchased_future__content', ct.__meta.locale, {
          receipt_url: invoice.stripe_receipt_url,
          user_name: user.name || user.username,
          performance_name: invoice.ticket.performance.name,
          premier_time: this.i18n.date(unix(invoice.ticket.performance.premiere_datetime), ct.__meta.locale),
          amount: this.i18n.money(invoice.amount, invoice.currency),
          url: link
        }),
        from: Env.EMAIL_ADDRESS,
        to: user.email_address,
        markdown: true,
        attachments: []
      });
    }
  }

  async setUserHostMarketingOptStatus(ct: Contract<'ticket.purchased'>) {
    // check if already consenting to this host, if not then soft-opt in
    const c = await this.ORM.createQueryBuilder(UserHostMarketingConsent, 'c')
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
  }
}
