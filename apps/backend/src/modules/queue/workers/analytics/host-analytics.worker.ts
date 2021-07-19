import { Host, Performance, Providers, HostAnalytics } from '@core/api';
import { JobData } from '@core/interfaces';
import { Job } from 'bullmq';
import { analyze } from './analytics.worker';

export default ({ orm }: { orm: InstanceType<typeof Providers.Postgres> }) => async (job: Job) => {
  const data: JobData['collect_host_analytics'] = job.data;
  const host = await Host.findOne({ where: { _id: data.host_id } });

  await analyze(
    new HostAnalytics(host),
    {
      performances_created: async (start, end) =>
        orm.connection
          .createQueryBuilder(Performance, 'p')
          .where('p.host__id = :host_id', { host_id: host._id })
          .andWhere('p.created_at BETWEEN :end AND :start', { end, start })
          .getCount()
    },
    job
  );
};
