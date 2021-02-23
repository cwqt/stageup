import { IScheduleReleaseJobData, JobType, Visibility } from '@core/interfaces';
import Env from 'apps/runner/src/env';
import { Worker } from 'bullmq';
import { api } from 'apps/runner/src';

export default () => {
  return new Worker(JobType.ScheduleRelease, async job => {
    const data: IScheduleReleaseJobData = job.data;
    await api.put(`${Env.API_URL}/performances/${data._id}/visibility`, { visibility: Visibility.Public });
  });
};
