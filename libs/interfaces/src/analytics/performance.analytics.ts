import { CurrencyCode } from '../common/currency.interface';
import { Idless } from '../common/fp.interface';
import { IPerformanceStub } from '../performances/performance.interface';
import { IAnalyticsAggregation } from './aggregation';
import { i18n } from '@core/helpers';

export interface IPerformanceAnalyticsMetrics {
  total_ticket_sales: number;
  total_revenue: number;
  average_watch_percentage: number;
  trailer_views: number;
  performance_views: number;
}

// what we send to the frontend
// allow us to do a comparison between latest & oldest to see diffs
export type DtoPerformanceAnalytics<isAggregate extends boolean = false> = IPerformanceStub & {
  analytics: {
    latest_period?: isAggregate extends true
      ? IAnalyticsAggregation<IPerformanceAnalyticsMetrics>
      : Array<IAnalyticsAggregation<IPerformanceAnalyticsMetrics>>;
    previous_period?: isAggregate extends true
      ? IAnalyticsAggregation<IPerformanceAnalyticsMetrics>
      : Array<IAnalyticsAggregation<IPerformanceAnalyticsMetrics>>;
  };
};

/**
 * @description Aggregate multiple aggregations into one larger one over a longer timespan
 * @param addition
 */
const aggregate = (analytics: IPerformanceAnalyticsMetrics[]): IPerformanceAnalyticsMetrics => {
  const aggregate: IPerformanceAnalyticsMetrics = analytics.reduce(
    (acc, addition, idx) => {
      acc = {
        total_revenue: acc.total_revenue + addition.total_revenue,
        total_ticket_sales: acc.total_ticket_sales + addition.total_ticket_sales,
        average_watch_percentage:
          (acc.average_watch_percentage + addition.average_watch_percentage) / (analytics.length - idx),
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

  return aggregate;
};

const formatters: {
  [index in keyof IPerformanceAnalyticsMetrics]: (
    value: IPerformanceAnalyticsMetrics[index],
    opts?: { locale?: string; currency?: CurrencyCode }
  ) => string;
} = {
  total_revenue: (v, { currency }) => i18n.money(v, currency),
  total_ticket_sales: (v, { locale }) => v.toLocaleString([locale]),
  trailer_views: (v, { locale }) => v.toLocaleString([locale]),
  performance_views: (v, { locale }) => v.toLocaleString([locale]),
  average_watch_percentage: v => `${v}%`
};

export const PerformanceAnalyticsMethods = { aggregate, formatters };
