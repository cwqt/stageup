import { IHostStub } from '../hosts/host.interface';
import { IAnalyticsChunk, MetricFormatters, MetricsAggregator } from './chunk-analytics.interface';

export type IHostAnalyticsMetrics = {
  performances_created: number;
};

export type DtoHostAnalytics = IHostStub & {
  chunks: Array<IAnalyticsChunk<IHostAnalyticsMetrics>>;
};

const aggregator: MetricsAggregator<IHostAnalyticsMetrics> = chunks =>
  chunks.reduce((acc, curr) => ({ performances_created: acc.performances_created + curr.performances_created }), {
    performances_created: 0
  });

const formatters: MetricFormatters<IHostAnalyticsMetrics> = {
  performances_created: (v, { locale }) => v.toLocaleString()
};

export const HostAnalyticsMethods = { aggregator: aggregator, formatters };
