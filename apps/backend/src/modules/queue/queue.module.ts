import Env from '@backend/env';
import { AsyncRouter, Auth, Providers } from '@core/api';
import { to } from '@core/helpers';
import { JobType, JobTypes, JobData } from '@core/interfaces';
import { Job, JobsOptions, Queue, QueueEvents, QueueScheduler, Worker } from 'bullmq';
import { setQueues, BullMQAdapter, router as BullRouter } from 'bull-board';
import { AsyncRouterInstance } from 'express-async-router';
import { ConnectionOptions } from 'tls';
import { add, Logger } from 'winston';
import { Module } from '..';
import { EventHandlers } from './handlers';
import HostInvoiceCSVWorker from './workers/host-invoice-csv.worker';
import HostInvoicePDFWorker from './workers/host-invoice-pdf.worker';
import SendEmailWorker from './workers/send-email.worker';
import { threadId } from 'worker_threads';
// import ScheduleReleaseWorker from './workers/schedule-release.worker';

interface IQueue<T extends JobType = any> {
  add: (data: JobData[T], opts?: JobsOptions) => Promise<any>;
  queue: Queue;
  events: QueueEvents;
  scheduler: QueueScheduler;
  worker: Worker;
}

export type QueueProviders = {
  i18n: InstanceType<typeof Providers.i18n>;
  email: InstanceType<typeof Providers.Email>;
  orm: InstanceType<typeof Providers.Postgres>;
};

export class QueueModule implements Module {
  name = 'Queue';
  log: Logger;
  router: AsyncRouter<any>;

  connectionOptions: ConnectionOptions;
  providers: QueueProviders;
  queues: { [index in JobType]: IQueue<index> };
  workers = {
    ['send_email']: SendEmailWorker,
    ['host_invoice_csv']: HostInvoiceCSVWorker,
    ['host_invoice_pdf']: HostInvoicePDFWorker
  };

  constructor(config: { redis: { host: string; port: number } }, log: Logger) {
    this.connectionOptions = { host: config.redis.host, port: config.redis.port };
    this.log = log;
  }

  async register(
    bus: InstanceType<typeof Providers.EventBus>,
    providers: QueueProviders
  ): Promise<AsyncRouterInstance> {
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
            case 'send_email':
              return this.workers['send_email']({
                email: providers.email
              });
            case 'host_invoice_pdf':
              return this.workers['host_invoice_pdf']({
                email: providers.email,
                orm: providers.orm
              });
            case 'host_invoice_csv':
              return this.workers['host_invoice_csv']({
                email: providers.email
              });
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

    const handlers = EventHandlers(this.queues, providers);
    // prettier-ignore
    {
      bus.subscribe("test.send_email",                  handlers.sendTestEmail);
      bus.subscribe('user.registered',                  handlers.sendUserVerificationEmail);
      bus.subscribe('user.invited_to_host',             handlers.sendUserHostInviteEmail);
      bus.subscribe('user.invited_to_private_showing',  handlers.sendUserPrivatePerformanceInviteEmail);
      bus.subscribe('user.password_reset_requested',    handlers.sendPasswordResetLinkEmail);
      bus.subscribe('user.password_changed',            handlers.sendPasswordChangedNotificationEmail);
      bus.subscribe('ticket.purchased',                 handlers.sendTicketReceiptEmail);
      bus.subscribe('refund.requested',                 handlers.sendInvoiceRefundRequestConfirmation);
      bus.subscribe('patronage.started', ct => {
        handlers.sendHostPatronSubscriptionStartedEmail(ct);
        handlers.sendUserPatronSubscriptionStartedReceiptEmail(ct);
      });
    }

    this.router = new AsyncRouter({}, Auth.none, this.log, providers.i18n);
    setQueues(Object.values(this.queues).map(q => new BullMQAdapter(q.queue)));
    this.router.use('/', BullRouter);
    return this.router.router;
  }

  destroy() {
    this.log.info(`Closing queue schedulers...`);
    Object.values(this.queues).forEach(q => q.scheduler.close());
  }
}
