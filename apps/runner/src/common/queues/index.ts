import { JobType } from '@core/interfaces';
import { Queue, QueueEvents, QueueScheduler, Worker } from 'bullmq';

export interface IQueue {
  queue: Queue;
  events: QueueEvents;
  scheduler: QueueScheduler;
  worker: Worker;
}

export type QueueMap = { [index in JobType]: IQueue };
export type WorkerFunction = () => Worker;

import SendEmailWorker from './workers/send_email.worker';
import ScheduleReleaseWorker from './workers/schedule_release.worker';
import { log } from '../logger';

const workers: { [index in JobType]: WorkerFunction } = {
  [JobType.SendEmail]: SendEmailWorker,
  [JobType.ScheduleRelease]: ScheduleReleaseWorker
};

const create = (): QueueMap => {
  return Object.values(JobType).reduce((acc, type) => {
    const queue = new Queue(type);
    const events = new QueueEvents(type);
    const scheduler = new QueueScheduler(type);
    const worker = workers[type]();

    events.on('completed', job => log.info(`Completed job: ${job.jobId}`));
    events.on('failed', (job, err) => log.error(`Failed job: ${job.jobId}`, err));

    acc[type] = {
      queue,
      events,
      worker,
      scheduler
    };

    return acc;
  }, {} as QueueMap);
};

const close = (map:QueueMap) => {
  log.info(`Closing queue schedulers...`)
  Object.values(map).forEach(m => m.scheduler.close());
}

export default { create, close };
