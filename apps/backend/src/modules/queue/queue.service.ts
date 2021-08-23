import { JobData, JobType } from '@core/interfaces';
import { JobsOptions } from 'bullmq';
import { Inject, Service } from 'typedi';
import { ModuleService } from '@core/api';
import { JOB_QUEUE_PROVIDER, JobQueueProvider, Queues } from './queue.provider';

@Service()
export class JobQueueService extends ModuleService {
  constructor(@Inject(JOB_QUEUE_PROVIDER) private queues: Queues) {
    super();
  }

  async addJob<T extends JobType>(type: T, data: JobData[T], opts: JobsOptions = {}) {
    await this.queues[type].add(data as any, opts);
  }
}
