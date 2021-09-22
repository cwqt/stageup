import Env from '@backend/env';
import { AUTOGEN_i18n_TOKEN_MAP } from '@backend/i18n/i18n-tokens.autogen';
import {
  EventBus,
  EVENT_BUS_PROVIDER,
  Host,
  Invoice,
  Logger,
  LOGGING_PROVIDER,
  ModuleEvents,
  PatronTier,
  SSEHubManagerProvider,
  SSE_HUB_PROVIDER,
  StripeProvider,
  STRIPE_PROVIDER,
  transact,
  Contract,
  I18N_PROVIDER,
  SSE,
  i18n
} from '@core/api';
import { richtext } from '@core/helpers';
import { CurrencyCode, JobType } from '@core/interfaces';
import moment from 'moment';
import Stripe from 'stripe';
import { Inject, Service } from 'typedi';
import { JobQueueService } from '../queue/queue.service';

@Service()
export class HostEvents extends ModuleEvents {
  constructor(
    private queueService: JobQueueService,
    @Inject(STRIPE_PROVIDER) private stripe: Stripe,
    @Inject(EVENT_BUS_PROVIDER) private bus: EventBus,
    @Inject(LOGGING_PROVIDER) private log: Logger,
    @Inject(I18N_PROVIDER) private i18n: i18n<AUTOGEN_i18n_TOKEN_MAP>
  ) {
    super();
    // prettier-ignore
    this.events = {
      ['host.created']:           this.createHostAnalyticsCollectionJob,
      ['host.stripe_connected']:  this.setupDefaultPatronTierForHost,
      ['host.invoice_export']:    this.sendHostInvoice,
    };
  }

  async sendHostInvoice(ct: Contract<'host.invoice_export'>) {
    await this.queueService.addJob(`host_invoice_${ct.format}` as JobType, {
      locale: ct.__meta.locale,
      sender_email_address: Env.EMAIL_ADDRESS,
      email_address: ct.email_address,
      invoice_ids: ct.invoice_ids
    });
  }

  async createHostAnalyticsCollectionJob(ct: Contract<'host.created'>) {
    // Collect analytics for this performance once per week at 0:00
    await this.queueService.addJob(
      'collect_host_analytics',
      { host_id: ct.host_id },
      {
        repeat: { every: 604800000 } // 7 days in milliseconds
      }
    );
  }

  async setupDefaultPatronTierForHost(ct: Contract<'host.stripe_connected'>) {
    await transact(async txc => {
      const host = await Host.findOne({ _id: ct.host_id });
      const tier = new PatronTier(
        {
          name: this.i18n.translate('@@host.example_patron_tier_name', ct.__meta.locale),
          description: richtext.read(
            richtext.create(this.i18n.translate(`@@host.example_patron_tier_description`, ct.__meta.locale))
          ),
          amount: 1000, // 10 GBP
          currency: CurrencyCode.GBP
        },
        host
      );

      await tier.setup(this.stripe, txc);
    });
  }

  async sendHostRefundRequestEmail(ct: Contract<'refund.requested'>) {
    const invoice = await Invoice.findOne(
      { _id: ct.invoice_id },
      { relations: { user: true, ticket: { performance: true }, host: true } }
    );

    this.queueService.addJob('send_email', {
      subject: this.i18n.translate('@@email.host_refund_requested_confirmation__subject', ct.__meta.locale, {
        performance_name: invoice.ticket.performance.name,
        user_username: invoice.user.username
      }),

      content: this.i18n.translate('@@email.host_refund_requested_confirmation__content', ct.__meta.locale, {
        host_name: invoice.host.username,
        user_username: invoice.user.username,
        user_email_address: invoice.user.email_address,
        invoice_id: invoice._id,
        performance_name: invoice.ticket.performance.name,
        purchase_date: moment.unix(invoice.purchased_at).format('LLLL'),
        amount: this.i18n.money(invoice.amount, invoice.currency),
        invoice_dashboard_url: `${Env.FRONTEND.URL}/${ct.__meta.locale.language}/dashboard/payments/invoices`
      }),

      from: Env.EMAIL_ADDRESS,
      to: invoice.host.email_address,
      attachments: []
    });
  }
}
