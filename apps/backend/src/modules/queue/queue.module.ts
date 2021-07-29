import Env from '@backend/env';
import { AUTOGEN_i18n_TOKEN_MAP } from '@backend/i18n/i18n-tokens.autogen';
import { IControllerEndpoint, Providers } from '@core/api';
import { to } from '@core/helpers';
import { JobData, JobType, JobTypes } from '@core/interfaces';
import { BullMQAdapter, router as BullRouter, setQueues } from 'bull-board';
import { Job, JobsOptions, Queue, QueueEvents, QueueScheduler, Worker } from 'bullmq';
import { combine } from 'libs/shared/src/api/event-bus/contracts';
import { i18nProvider } from 'libs/shared/src/api/i18n';
import { ConnectionOptions } from 'tls';
import { Logger } from 'winston';
import { Module } from '..';
import Auth from '../../common/authorisation';
import { EventHandlers } from './handlers';
import CollectHostAnalytics from './workers/analytics/host-analytics.worker';
import CollectPerformanceAnalytics from './workers/analytics/performance-analytics.worker';
import HostInvoiceCSVWorker from './workers/host-invoice-csv.worker';
import HostInvoicePDFWorker from './workers/host-invoice-pdf.worker';
import SendEmailWorker from './workers/send-email.worker';
// import ScheduleReleaseWorker from './workers/schedule-release.worker';

interface IQueue<T extends JobType = any> {
  add: (data: JobData[T], opts?: JobsOptions) => Promise<any>;
  queue: Queue;
  events: QueueEvents;
  scheduler: QueueScheduler;
  worker: Worker;
}

export type QueueProviders = {
  i18n: i18nProvider<AUTOGEN_i18n_TOKEN_MAP>;
  email: InstanceType<typeof Providers.Email>;
  orm: InstanceType<typeof Providers.Postgres>;
  stripe: InstanceType<typeof Providers.Stripe>;
  bus: InstanceType<typeof Providers.EventBus>;
  mux: InstanceType<typeof Providers.Mux>;
};

const w = worker => {
  return async (job: Job) => {
    try {
      console.log('Handling job', job.name, job.id);
      return await worker(job);
    } catch (error) {
      console.log('Job failed', error);
    }
  };
};

export class QueueModule implements Module {
  name = 'Queue';
  log: Logger;
  routes: {
    jobQueueUi: IControllerEndpoint<void>;
  };

  connectionOptions: ConnectionOptions;
  providers: QueueProviders;
  queues: { [index in JobType]: IQueue<index> };
  workers = {
    ['send_email']: SendEmailWorker,
    ['host_invoice_csv']: HostInvoiceCSVWorker,
    ['host_invoice_pdf']: HostInvoicePDFWorker,
    ['collect_performance_analytics']: CollectPerformanceAnalytics,
    ['collect_host_analytics']: CollectHostAnalytics
  };

  constructor(config: { redis: { host: string; port: number } }, log: Logger) {
    this.connectionOptions = { host: config.redis.host, port: config.redis.port };
    this.log = log;
  }

  async register(bus: InstanceType<typeof Providers.EventBus>, providers: QueueProviders) {
    this.providers = providers;
    this.log.info(`Registering module ${this.name}...`);

    // Setup a single worker for each queue
    this.queues = JobTypes.reduce((acc, type) => {
      const queue = new Queue(type, { connection: this.connectionOptions });
      const events = new QueueEvents(type, { connection: this.connectionOptions });
      const scheduler = new QueueScheduler(type, { connection: this.connectionOptions });
      const worker = new Worker(
        type,
        (() => {
          switch (type) {
            case 'collect_performance_analytics':
              return w(this.workers['collect_performance_analytics']({ orm: providers.orm, mux: providers.mux }));
            case 'collect_host_analytics':
              return w(this.workers['collect_host_analytics']({ orm: providers.orm }));
            case 'send_email':
              return w(
                this.workers['send_email']({
                  email: providers.email
                })
              );
            case 'host_invoice_pdf':
              return w(
                this.workers['host_invoice_pdf']({
                  email: providers.email,
                  orm: providers.orm,
                  i18n: providers.i18n
                })
              );
            case 'host_invoice_csv':
              return w(
                this.workers['host_invoice_csv']({
                  email: providers.email,
                  i18n: providers.i18n
                })
              );
          }
        })(),
        { connection: this.connectionOptions }
      );

      events.on('completed', job => this.log.info(`Completed job: ${job.jobId}`));
      events.on('failed', (job, err) => {
        this.log.error(`Failed job: ${job.jobId}`, err);
        console.error(err);
      });

      acc[type] = to<IQueue>({
        queue,
        events,
        worker,
        scheduler,
        add: async (data, opts) => queue.add(type, data, opts)
      });

      return acc;
    }, {} as any);

    const handlers = new EventHandlers(this.queues, providers);

    // prettier-ignore
    {
      bus.subscribe("performance.created",               handlers.createPerformanceAnalyticsCollectionJob);
      bus.subscribe("host.created",                      handlers.createHostAnalyticsCollectionJob)
      bus.subscribe('host.stripe_connected',             handlers.setupDefaultPatronTierForHost);
      bus.subscribe("host.invoice_export",              async ct => {
        if(ct.format == "pdf") await this.queues.host_invoice_pdf.add({
          locale: ct.__meta.locale,
          sender_email_address: Env.EMAIL_ADDRESS,
          email_address: ct.email_address, invoice_ids: ct.invoice_ids})

        if(ct.format == "csv") await this.queues.host_invoice_csv.add({
          locale: ct.__meta.locale,
          sender_email_address: Env.EMAIL_ADDRESS,
          email_address: ct.email_address, invoice_ids: ct.invoice_ids})
      });

      bus.subscribe('refund.requested',                  handlers.sendInvoiceRefundRequestConfirmation);
      bus.subscribe("refund.initiated",        combine([ handlers.sendUserRefundInitiatedEmail, handlers.sendHostRefundInitiatedEmail, handlers.enactStripeRefund]));
      bus.subscribe("refund.refunded",         combine([ handlers.sendUserRefundRefundedEmail, handlers.sendHostRefundRefundedEmail]))
      bus.subscribe("refund.bulk",                       handlers.processBulkRefunds);
      bus.subscribe("test.send_email",                   handlers.sendTestEmail);
      bus.subscribe('user.registered',                   handlers.sendUserVerificationEmail);
      bus.subscribe('user.invited_to_host',              handlers.sendUserHostInviteEmail);
      // bus.subscribe('user.invited_to_private_showing',  handlers.sendUserPrivatePerformanceInviteEmail);
      bus.subscribe('user.password_reset_requested',     handlers.sendPasswordResetLinkEmail);
      bus.subscribe('user.password_changed',             handlers.sendPasswordChangedNotificationEmail);
      bus.subscribe('user.registered',                   handlers.sendUserVerificationEmail);
      bus.subscribe('user.invited_to_host',              handlers.sendUserHostInviteEmail);
      bus.subscribe('user.invited_to_private_showing',   handlers.sendUserPrivatePerformanceInviteEmail);
      bus.subscribe('user.password_reset_requested',     handlers.sendPasswordResetLinkEmail);
      bus.subscribe('user.password_changed',             handlers.sendPasswordChangedNotificationEmail);
      bus.subscribe('ticket.purchased',        combine([ handlers.sendTicketReceiptEmail,
                                                         handlers.setUserHostMarketingOptStatus]));
      bus.subscribe("patronage.tier_deleted",            handlers.unsubscribeAllPatronTierSubscribers);
      bus.subscribe("patronage.unsubscribe_user",        handlers.unsubscribeFromPatronTier);
      bus.subscribe("patronage.user_unsubscribed",       handlers.sendUserUnsubscribedConfirmationEmail);
      bus.subscribe("patronage.tier_amount_changed",     handlers.transferAllTierSubscribersToNewTier);
      bus.subscribe('patronage.started',       combine([ handlers.sendHostPatronSubscriptionStartedEmail,
                                                         handlers.sendUserPatronSubscriptionStartedReceiptEmail]))
    }

    setQueues(Object.values(this.queues).map(q => new BullMQAdapter(q.queue)) as any);

    this.routes = {
      jobQueueUi: {
        authorisation: Auth.isSiteAdmin,
        controller: async req => {},
        handler: BullRouter as any
      }
    };

    return this;
  }

  destroy() {
    this.log.info(`Closing queue schedulers...`);
    Object.values(this.queues).forEach(q => q.scheduler.close());
  }
}
