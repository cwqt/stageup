import { PerformanceAnalytics, Providers, Performance, Invoice, Ticket } from '@core/api';
import { timestamp } from '@core/helpers';
import {
  CurrencyCode,
  IPerformanceAnalyticsMetrics,
  IPerformanceStub,
  JobData,
  PurchaseableType
} from '@core/interfaces';
import { Job } from 'bullmq';

// Add aggregators as needed.....for later stories e.g.
const aggregators: {
  [index in keyof IPerformanceAnalyticsMetrics]?: (
    performanceId: string,
    orm: InstanceType<typeof Providers.Postgres>,
    start: number,
    end: number
  ) => Promise<IPerformanceAnalyticsMetrics[index]>;
} = {
  total_ticket_sales: async (pid, orm, start, end) => {
    // Get all tickets that are on this performance
    const performance = await Performance.findOne({ where: { _id: pid }, relations: { tickets: true } });

    // Get a count of all invoices across all tickets purchased between this period
    return await orm.connection
      .createQueryBuilder(Invoice, 'i')
      .where('i.type = :type', { type: PurchaseableType.Ticket })
      .andWhere('i.ticket__id IN (:...ticketIds)', { ticketIds: performance.tickets.map(t => t._id) })
      .andWhere('i.purchased_at BETWEEN :end AND :start', { start, end })
      .getCount();
  },
  total_revenue: async (pid, orm, start, end) => {
    // Get all tickets that are on this performance
    const performance = await Performance.findOne({ where: { _id: pid }, relations: { tickets: true } });

    // Get the sum of all invoice quantities sold between this period
    const { sum } = (await orm.connection
      .createQueryBuilder(Invoice, 'i')
      .where('i.type = :type', { type: PurchaseableType.Ticket })
      .andWhere('i.ticket__id IN (:...ticketIds)', { ticketIds: performance.tickets.map(t => t._id) })
      .andWhere('i.purchased_at BETWEEN :end AND :start', { start, end })
      .select('SUM(i.amount)', 'sum') // returns as string if matches, or null if none
      .getRawOne()) || { sum: '0' };

    return parseInt(sum);
  }
};

export default ({ orm }: { orm: InstanceType<typeof Providers.Postgres> }) => async (job: Job) => {
  const data: JobData['collect_analytics'] = job.data;

  const performance = await Performance.findOne({ where: { _id: data.performance_id } });

  //  end             start
  //   |---------------|
  //   t -->         present
  const aggregation = new PerformanceAnalytics(performance, {
    period_start: timestamp(), // in ms
    period_end: timestamp() - job.opts.repeat.every / 1000
  });

  aggregation.collection_started_at = timestamp();

  // Initial state
  const metrics: IPerformanceAnalyticsMetrics = {
    total_ticket_sales: 0,
    total_revenue: 0,
    average_watch_percentage: 0,
    trailer_views: 0,
    performance_views: 0
  };

  // Now get the aggregators going
  for await (let metric of Object.keys(metrics)) {
    metrics[metric] =
      (await aggregators[metric]?.(data.performance_id, orm, aggregation.period_start, aggregation.period_end)) ||
      metrics[metric];
  }

  aggregation.metrics = metrics;
  aggregation.collection_ended_at = timestamp();
  await aggregation.save();
};
