import { Providers } from '@core/api';
import { Job } from 'bullmq';

export default ({ email }: { email: InstanceType<typeof Providers.Email> }) => async (job: Job) => {
  return email.send(job.data);
};
