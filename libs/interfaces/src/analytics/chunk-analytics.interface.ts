/**
 * Analytics works by once a week, running a job to capture the previous week of data
 * See performance.analytics.ts for fully commented example
 *
 *  Aggregation 1/1/20   oldest
 *  Aggregation 8/1/20
 *  Aggregation 15/1/20  newest
 */

import { Idless } from '..';
import { CurrencyCode } from '../common/currency.interface';
import { HostAnalyticsMethods, IHostAnalyticsMetrics } from './host-analytics.interface';
import { IPerformanceAnalyticsMetrics, PerformanceAnalyticsMethods } from './performance-analytics.interface';

type EntityMetricMapping = {
  host: IHostAnalyticsMetrics;
  performance: IPerformanceAnalyticsMetrics;
};

type MonitoredEntities = keyof EntityMetricMapping;
export type EntityMetric = EntityMetricMapping[MonitoredEntities];

// Abstract entity for PerformanceAnalytics & HostAnalytics entities to inherit from
// represents a collection of data through a specific time period
export interface IAnalyticsChunk<T extends EntityMetric> {
  _id: string;
  period_started_at: number; // from what period the data came from
  period_ended_at: number;
  collection_started_at: number; // when the data was collected
  collection_ended_at: number;
  metrics: T; // represents data collected through 'period'
}

// Iterable enum & union
export const AnalyticsTimePeriods = ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'] as const;
export type AnalyticsTimePeriod = typeof AnalyticsTimePeriods[number]; // string union

/**
 * @description Allow us to do a comparison between latest & oldest to see diffs
 * Can be array (for complete composition) or aggregate (across many chunks (see AnalyticsAggregator))
 */
export type AnalyticsPeriodDifference<T extends EntityMetric, isPeriodAggregate extends boolean = false> = {
  latest_period?: isPeriodAggregate extends true ? Idless<IAnalyticsChunk<T>> : Array<IAnalyticsChunk<T>>;
  previous_period?: isPeriodAggregate extends true ? Idless<IAnalyticsChunk<T>> : Array<IAnalyticsChunk<T>>;
};

/**
 * @description Takes a raw metric value and transforms into into a localised version for the user to see
 */
export type MetricFormatters<T extends EntityMetric> = {
  [index in keyof T]: (value: T[index], opts?: { locale?: string; currency?: CurrencyCode }) => string;
};

/**
 * @description Aggregate multiple metrics into a single objects with all values summed
 */
export type MetricsAggregator<T extends EntityMetric> = (chunkMetrics: T[]) => T;

/**
 * @description Takes a metrics aggregator and completes it by adding up durations
 */
export type AnalyticsAggregator<T extends EntityMetric> = (
  chunks: Array<IAnalyticsChunk<T>>
) => Idless<IAnalyticsChunk<T>>;

/**
 * @description HoF wrapper for aggregating aggregates using a MetricsAggregator
 * @example PerformanceAnalytics.aggregator = aggregize(fn)
 */
const aggregize: <T extends EntityMetric>(aggregator: MetricsAggregator<T>) => AnalyticsAggregator<T> = <
  T extends EntityMetric
>(
  aggregator: MetricsAggregator<T>
): AnalyticsAggregator<T> => {
  return chunks => {
    return {
      metrics: aggregator(chunks.map(c => c.metrics)),
      period_ended_at: chunks.sort((a, b) => (a.period_ended_at > b.period_ended_at ? 1 : -1)).pop()?.period_ended_at,
      period_started_at: chunks.sort((a, b) => (a.period_started_at > b.period_started_at ? 1 : -1)).pop()
        ?.period_started_at,
      collection_ended_at: chunks.sort((a, b) => (a.collection_ended_at > b.collection_ended_at ? 1 : -1)).pop()
        ?.collection_ended_at,
      collection_started_at: chunks.sort((a, b) => (a.collection_started_at > b.collection_started_at ? 1 : -1)).pop()
        ?.collection_started_at
    };
  };
};

// Entry-point
export const Analytics: {
  offsets: { [index in AnalyticsTimePeriod]: number };
  entities: {
    [index in MonitoredEntities]: {
      formatters: MetricFormatters<EntityMetricMapping[index]>;
      aggregators: {
        chunks: AnalyticsAggregator<EntityMetricMapping[index]>;
        metrics: MetricsAggregator<EntityMetricMapping[index]>;
      };
    };
  };
} = {
  // Number of weekly aggregations to offset from present date
  offsets: {
    WEEKLY: 1,
    MONTHLY: 4, // 4 aggregation periods in a month
    QUARTERLY: 13, // 13 in a quarter... etc.
    YEARLY: 52
  },
  entities: {
    performance: {
      formatters: PerformanceAnalyticsMethods.formatters,
      aggregators: {
        chunks: aggregize(PerformanceAnalyticsMethods.aggregator),
        metrics: PerformanceAnalyticsMethods.aggregator
      }
    },
    host: {
      formatters: HostAnalyticsMethods.formatters,
      aggregators: {
        chunks: aggregize(HostAnalyticsMethods.aggregator),
        metrics: HostAnalyticsMethods.aggregator
      }
    }
  }
};

export type PerfromanceAnalyticsType = IAnalyticsChunk<IPerformanceAnalyticsMetrics>[]