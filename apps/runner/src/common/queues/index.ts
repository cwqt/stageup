import Env from '../../env';
import SendEmailWorker from './workers/send-email.worker';
import ScheduleReleaseWorker from './workers/schedule-release.worker';
import HostInvoiceCSVWorker from './workers/host-invoice-csv.worker';
import HostInvoicePDFWorker from './workers/host-invoice-pdf.worker'

import { log } from '../logger';
import { RunnerProviderMap } from '../..';
import { JobType } from '@core/interfaces';
import { Queue, QueueEvents, QueueScheduler, Worker } from 'bullmq';

export interface IQueue {
  queue: Queue;
  events: QueueEvents;
  scheduler: QueueScheduler;
  worker: Worker;
}

export type QueueMap = { [index in JobType]: IQueue };
export type WorkerFunction = (providers: RunnerProviderMap) => Worker;

const create = (pm: RunnerProviderMap): QueueMap => {
  const workers: { [index in JobType]: WorkerFunction } = {
    [JobType.SendEmail]: SendEmailWorker,
    [JobType.ScheduleRelease]: ScheduleReleaseWorker,
    [JobType.HostInvoiceCSV]: HostInvoiceCSVWorker,
    [JobType.HostInvoicePDF]: HostInvoicePDFWorker
  };

  return Object.values(JobType).reduce((acc, type) => {
    const queue = new Queue(type, {
      connection: {
        host: Env.REDIS.host,
        port: Env.REDIS.port
      }
    });

    const events = new QueueEvents(type, {
      connection: {
        host: Env.REDIS.host,
        port: Env.REDIS.port
      }
    });

    const scheduler = new QueueScheduler(type, {
      connection: {
        host: Env.REDIS.host,
        port: Env.REDIS.port
      }
    });

    const worker = workers[type](pm);

    events.on('completed', job => log.info(`Completed job: ${job.jobId}`));
    events.on('failed', (job, err) => {
      log.error(`Failed job: ${job.jobId}`, err);
      console.error(err);
    });

    acc[type] = {
      queue,
      events,
      worker,
      scheduler
    };

    return acc;
  }, {} as QueueMap);
};

const close = (map: QueueMap) => {
  log.info(`Closing queue schedulers...`);
  Object.values(map).forEach(m => m.scheduler.close());
};

export default { create, close };
