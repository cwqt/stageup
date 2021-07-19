import { AnalyticsChunk, PerformanceAnalytics, transact } from '@core/api';
import { Job } from 'bullmq';
import { timestamp } from '@core/helpers';

type AnalyticsMetricsResolvers<T = {}> = { [index in keyof T]?: (start: number, end: number) => Promise<T[index]> };

export const analyze = async <T extends AnalyticsChunk<any>>(
  entity: T,
  resolvers: AnalyticsMetricsResolvers<T['metrics']>,
  job: Job
) => {
  entity.period_started_at = timestamp();
  entity.period_ended_at = entity.period_started_at - job.opts.repeat.every / 1000;

  entity.collection_started_at = timestamp();

  for await (let metric of Object.keys(resolvers)) {
    entity.metrics[metric] = await resolvers[metric](entity.period_started_at, entity.period_ended_at);
  }

  entity.collection_ended_at = timestamp();
  return entity.save();
};
