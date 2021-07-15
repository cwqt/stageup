/**
 * Collect aggregation of values once per week on specific performance
 *  Aggregation 1/1/20   oldest
 *  Aggregation 8/1/20
 *  Aggregation 15/1/20  newest
 */

export interface IAnalyticsAggregation<T> {
  _id: string;
  period_start: number;
  period_end: number;
  collection_started_at: number;
  collection_ended_at: number;
  metrics: T;
  composure: Array<{ period_start: number; period_end: number; _id: string }>;
}

export const AnalyticsTimePeriods = ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'] as const;
export type AnalyticsTimePeriod = typeof AnalyticsTimePeriods[number]; // string union
