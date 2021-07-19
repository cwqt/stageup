import { Host } from '@core/api';
import { IAnalyticsChunk, IHostAnalyticsMetrics } from '@core/interfaces';
import { ChildEntity, JoinColumn, ManyToOne } from 'typeorm';
import { AnalyticsChunk } from './chunk-analytics.entity';

@ChildEntity()
export class HostAnalytics extends AnalyticsChunk<IHostAnalyticsMetrics> {
  @ManyToOne(() => Host) @JoinColumn() host: Host;

  constructor(host: Host) {
    super();
    this.host = host;

    // Initial state
    this.metrics = {
      performances_created: 0
    };
  }

  toDto(): Required<IAnalyticsChunk<IHostAnalyticsMetrics>> {
    return { ...super.toDto(), metrics: this.metrics };
  }
}
