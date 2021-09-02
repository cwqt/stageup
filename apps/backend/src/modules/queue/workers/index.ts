import { JobType, JobData } from '@core/interfaces';
import { Job } from 'bullmq';

export class WorkerScript<T extends JobType = any> {
  script: (job: Job<JobData[T]>) => Promise<void>;
  constructor() {}

  async run(job: Job) {
    try {
      console.log('Handling job', job.name, job.id);
      await this.script(job);
    } catch (error) {
      console.log('Job failed', error);
    }
  }
}
