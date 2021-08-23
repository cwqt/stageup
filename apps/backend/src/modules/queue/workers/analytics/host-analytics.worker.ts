import { Host, Performance, HostAnalytics, PostgresProvider, POSTGRES_PROVIDER } from '@core/api';
import { JobData } from '@core/interfaces';
import { Job } from 'bullmq';
import { collectMetrics } from './analytics.worker';
import { Inject, Service } from 'typedi';
import { WorkerScript } from '..';
import { Connection } from 'typeorm';

@Service()
export default class extends WorkerScript<'collect_host_analytics'> {
  constructor(@Inject(POSTGRES_PROVIDER) private ORM: Connection) {
    super();

    this.script = async job => {
      const { data } = job;
      const host = await Host.findOne({ where: { _id: data.host_id } });

      await collectMetrics(
        new HostAnalytics(host),
        {
          performances_created: async (start, end) =>
            this.ORM.createQueryBuilder(Performance, 'p')
              .where('p.host__id = :host_id', { host_id: host._id })
              .andWhere('p.created_at BETWEEN :start AND :end', { end, start })
              .getCount()
        },
        job
      );
    };
  }
}
