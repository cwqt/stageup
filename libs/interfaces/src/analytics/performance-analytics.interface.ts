import { i18n } from '@core/helpers';
import { IPerformanceStub } from '../performances/performance.interface';
import { IAnalyticsChunk, MetricFormatters, MetricsAggregator } from './chunk-analytics.interface';

// Data that is collected on the performance in the last week
export type IPerformanceAnalyticsMetrics = {
  total_ticket_sales: number;
  total_revenue: number;
  average_watch_percentage: number;
  trailer_views: number;
  performance_views: number;
};

// What we send to the frontend
export type DtoPerformanceAnalytics = IPerformanceStub & {
  chunks: Array<IAnalyticsChunk<IPerformanceAnalyticsMetrics>>;
};
export type DtoPerformanceIDAnalytics = {
  performanceId: IPerformanceStub['_id'];
  chunks: Array<IAnalyticsChunk<IPerformanceAnalyticsMetrics>>;
};

/**
 * @description Aggregate multiple aggregations into one larger one over a longer timespan
 * @param addition
 */
const aggregator: MetricsAggregator<IPerformanceAnalyticsMetrics> = chunks =>
  chunks.reduce(
    (acc, addition, idx) => {
      acc = {
        total_revenue: acc.total_revenue + addition.total_revenue,
        total_ticket_sales: acc.total_ticket_sales + addition.total_ticket_sales,
        average_watch_percentage:
          (acc.average_watch_percentage + addition.average_watch_percentage) / (chunks.length - idx),
        trailer_views: acc.trailer_views + addition.trailer_views,
        performance_views: acc.performance_views + addition.performance_views
      };

      return acc;
    },
    {
      total_ticket_sales: 0,
      total_revenue: 0,
      average_watch_percentage: 0,
      trailer_views: 0,
      performance_views: 0
    }
  );

const formatters: MetricFormatters<IPerformanceAnalyticsMetrics> = {
  total_revenue: (v, { currency }) => i18n.money(v, currency),
  total_ticket_sales: (v, { locale }) => v.toLocaleString([locale]),
  trailer_views: (v, { locale }) => v.toLocaleString([locale]),
  performance_views: (v, { locale }) => v.toLocaleString([locale]),
  average_watch_percentage: v => `${v}%`
};

export const PerformanceAnalyticsMethods = { aggregator, formatters };
