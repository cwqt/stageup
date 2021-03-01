import { JobType } from '@core/interfaces';
import { Queue, QueueEvents, QueueScheduler, Worker } from 'bullmq';

export interface IQueue {
  queue: Queue;
  events: QueueEvents;
  scheduler: QueueScheduler;
  worker: Worker;
}

export type QueueMap = { [index in JobType]: IQueue };
export type WorkerFunction = (providers: DataClient<RunnerDataClient>) => Worker;

import SendEmailWorker from './workers/send_email.worker';
import ScheduleReleaseWorker from './workers/schedule_release.worker';
import { log } from '../logger';
import { DataClient, ProviderMap } from '@core/shared/api';
import { RunnerDataClient } from '../data';
import Env from '../../env';

const create = (client: DataClient<RunnerDataClient>): QueueMap => {
  const workers: { [index in JobType]: WorkerFunction } = {
    [JobType.SendEmail]: SendEmailWorker,
    [JobType.ScheduleRelease]: ScheduleReleaseWorker
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

    const worker = workers[type](client);

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

const close = (map: QueueMap) => {
  log.info(`Closing queue schedulers...`);
  Object.values(map).forEach(m => m.scheduler.close());
};

export default { create, close };
