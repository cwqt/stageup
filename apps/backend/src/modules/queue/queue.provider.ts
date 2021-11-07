import { AUTOGEN_i18n_TOKEN_MAP } from '@backend/i18n/i18n-tokens.autogen';
import {
  EMAIL_PROVIDER,
  Logger,
  LOGGING_PROVIDER,
  MuxProvider,
  MUX_PROVIDER,
  PostgresProvider,
  POSTGRES_PROVIDER,
  Provider
} from '@core/api';
import { to } from '@core/helpers';
import { JobData, JobType, JobTypes } from '@core/interfaces';
import { BullMQAdapter, setQueues } from 'bull-board';
import { Job, JobsOptions, Queue, QueueEvents, QueueScheduler, Worker } from 'bullmq';
import { ConnectionOptions } from 'tls';
import Container, { Constructable, Inject, Token } from 'typedi';
import { WorkerScript } from './workers';
import CollectHostAnalytics from './workers/analytics/host-analytics.worker';
import CollectPerformanceAnalytics from './workers/analytics/performance-analytics.worker';
import HostInvoiceCSVWorker from './workers/host-invoice-csv.worker';
import HostInvoicePDFWorker from './workers/host-invoice-pdf.worker';
import HostAudienceCSVWorker from './workers/host-audience-csv.worker';
import SendEmailWorker from './workers/send-email.worker';
import SendReminderEmailsWorker from './workers/send-reminder-emails.worker';
// import ScheduleReleaseWorker from './workers/schedule-release.worker';

export type Queues = { [index in JobType]: IQueue<index> };

export const JOB_QUEUE_PROVIDER = new Token<Provider<Queues>>('JOB_QUEUE_PROVIDER');

export interface IQueue<T extends JobType = any> {
  add: (data: JobData[T], opts?: JobsOptions) => Promise<any>;
  queue: Queue;
  events: QueueEvents;
  scheduler: QueueScheduler;
  worker: Worker;
}

export interface IJobQueueProviderConfig {
  redis_host: string;
  redis_port: number;
}

export class JobQueueProvider implements Provider<Queues> {
  name = 'Queue';
  connection: Queues;
  config: IJobQueueProviderConfig;
  log: Logger;

  private connectionOptions: ConnectionOptions;
  private scripts: { [index in JobType]: Constructable<WorkerScript> } = {
    ['send_email']: SendEmailWorker,
    ['send_reminder_emails']: SendReminderEmailsWorker,
    ['host_invoice_csv']: HostInvoiceCSVWorker,
    ['host_invoice_pdf']: HostInvoicePDFWorker,
    ['host_audience_csv']: HostAudienceCSVWorker,
    ['collect_performance_analytics']: CollectPerformanceAnalytics,
    ['collect_host_analytics']: CollectHostAnalytics
  };

  constructor(config: IJobQueueProviderConfig) {
    this.config = config;
    this.connectionOptions = { host: this.config.redis_host, port: this.config.redis_port };
    this.log = Container.get(LOGGING_PROVIDER);
  }

  async connect() {
    // Setup a single worker for each queue
    this.connection = Object.keys(this.scripts).reduce((acc, type) => {
      const queue = new Queue(type, { connection: this.connectionOptions });
      const events = new QueueEvents(type, { connection: this.connectionOptions });
      const scheduler = new QueueScheduler(type, { connection: this.connectionOptions });

      const script: WorkerScript<any> = Container.get(this.scripts[type]);
      const worker = new Worker(type, async job => script.run(job), { connection: this.connectionOptions });

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

    // Attach all queues to BullMQ
    setQueues(Object.values(this.connection).map(q => new BullMQAdapter(q.queue)) as any);

    return this.connection;
  }

  async disconnect() {
    this.log.info(`Closing queue schedulers...`);
    Object.values(this.connection).forEach(q => q.scheduler.close());
  }
}
