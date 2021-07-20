import { IAnalyticsChunk, IPerformanceAnalyticsMetrics } from '@core/interfaces';
import { ChildEntity, Column, JoinColumn, ManyToOne } from 'typeorm';
import { Performance } from '../performances/performance.entity';
import { AnalyticsChunk } from './chunk-analytics.entity';

@ChildEntity()
export class PerformanceAnalytics extends AnalyticsChunk<IPerformanceAnalyticsMetrics> {
  @Column('json') metrics: IPerformanceAnalyticsMetrics;
  @ManyToOne(() => Performance) @JoinColumn() performance: Performance;

  constructor(performance: Performance) {
    super();
    this.performance = performance;

    // Initial state
    this.metrics = {
      total_ticket_sales: 0,
      total_revenue: 0,
      average_watch_percentage: 0,
      trailer_views: 0,
      performance_views: 0
    };
  }

  toDto(): Required<IAnalyticsChunk<IPerformanceAnalyticsMetrics>> {
    return { ...super.toDto(), metrics: this.metrics };
  }
}
