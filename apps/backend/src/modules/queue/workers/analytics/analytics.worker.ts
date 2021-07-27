import { AnalyticsChunk, PerformanceAnalytics, transact } from '@core/api';
import { Job } from 'bullmq';
import { timestamp } from '@core/helpers';
import { EntityMetric } from '@core/interfaces';

type AnalyticsMetricsResolvers<T extends EntityMetric> = {
  [index in keyof T]?: (start: number, end: number) => Promise<T[index]>;
};

export const collectMetrics = async <T extends AnalyticsChunk<EntityMetric>>(
  entity: T,
  resolvers: AnalyticsMetricsResolvers<T['metrics']>,
  job: Job
) => {
  // start      end
  //   |---------|
  //   t -->    now
  entity.period_ended_at = timestamp();
  entity.period_started_at = entity.period_ended_at - job.opts.repeat.every / 1000;

  entity.collection_started_at = timestamp();

  for await (let metric of Object.keys(resolvers)) {
    entity.metrics[metric] = await resolvers[metric](entity.period_started_at, entity.period_ended_at);
  }

  entity.collection_ended_at = timestamp();
  return entity.save();
};
