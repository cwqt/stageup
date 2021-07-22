import { AssetGroup, AssetView, Invoice, Performance, PerformanceAnalytics, Providers } from '@core/api';
import { JobData, PurchaseableType } from '@core/interfaces';
import { Job } from 'bullmq';
import { collectMetrics } from './analytics.worker';

export default ({
  orm,
  mux
}: {
  orm: InstanceType<typeof Providers.Postgres>;
  mux: InstanceType<typeof Providers.Mux>;
}) => async (job: Job) => {
  const data: JobData['collect_performance_analytics'] = job.data;
  const performance = await Performance.findOne({ where: { _id: data.performance_id } });

  await collectMetrics(
    new PerformanceAnalytics(performance),
    {
      total_ticket_sales: async (start, end) => {
        // Get all tickets that are on this performance
        const { tickets } = await Performance.findOne({
          where: { _id: performance._id },
          relations: { tickets: true }
        });

        // Get a count of all invoices across all tickets purchased between this period
        return await orm.connection
          .createQueryBuilder(Invoice, 'i')
          .where('i.type = :type', { type: PurchaseableType.Ticket })
          .andWhere('i.ticket__id IN (:...ticketIds)', { ticketIds: tickets.map(t => t._id) })
          .andWhere('i.purchased_at BETWEEN :start AND :end', { start, end })
          .getCount();
      },
      total_revenue: async (start, end) => {
        // Get all tickets that are on this performance
        const { tickets } = await Performance.findOne({
          where: { _id: performance._id },
          relations: { tickets: true }
        });

        // Get the sum of all invoice quantities sold between this period
        const { sum } = (await orm.connection
          .createQueryBuilder(Invoice, 'i')
          .where('i.type = :type', { type: PurchaseableType.Ticket })
          .andWhere('i.ticket__id IN (:...ticketIds)', { ticketIds: tickets.map(t => t._id) })
          .andWhere('i.purchased_at BETWEEN :start AND :end', { start, end })
          .select('SUM(i.amount)', 'sum') // returns as string if matches, or null if none
          .getRawOne()) || { sum: '0' };

        return parseInt(sum);
      },
      performance_views: async (start, end) =>
        orm.connection
          .createQueryBuilder(AssetView, 'view')
          .where('view.performance__id = :pid', { pid: performance._id })
          .andWhere('view.viewed_at BETWEEN :end AND :start', { start, end })
          .getCount()
    },
    job
  );
};