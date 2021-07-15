import { uuid } from '@core/helpers';
import { IAnalyticsAggregation, Idless, IPerformance, IPerformanceAnalyticsMetrics } from '@core/interfaces';
import { Performance } from '../performances/performance.entity';
import { Except } from 'type-fest';
import {
  BaseEntity,
  BeforeInsert,
  ChildEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  TableInheritance
} from 'typeorm';

type MetricslessAggregation<T> = Except<IAnalyticsAggregation<T>, 'metrics'>;

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class AnalyticsAggregation<T>
  extends BaseEntity
  implements Except<MetricslessAggregation<T>, 'composure'> {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() {
    this._id = uuid();
  }

  @Column() period_start: number;
  @Column() period_end: number;
  @Column() collection_started_at: number;
  @Column() collection_ended_at: number;

  composure: IAnalyticsAggregation<T>['composure'];

  constructor(data: Pick<IAnalyticsAggregation<T>, 'period_end' | 'period_start'>) {
    super();
    this.period_start = data.period_start;
    this.period_end = data.period_end;
  }

  toDto(): Required<MetricslessAggregation<T>> {
    return {
      _id: this._id,
      period_end: this.period_end,
      period_start: this.period_end,
      collection_ended_at: this.collection_ended_at,
      collection_started_at: this.collection_ended_at,
      composure: this.composure || [{ period_end: this.period_end, period_start: this.period_start, _id: this._id }] // only used in .aggregate
    };
  }
}

@ChildEntity()
export class PerformanceAnalytics extends AnalyticsAggregation<IPerformanceAnalyticsMetrics> {
  @Column('json') metrics: IPerformanceAnalyticsMetrics;
  @ManyToOne(() => Performance) @JoinColumn() performance: Performance;

  constructor(
    performance: Performance,
    data: Pick<IAnalyticsAggregation<IPerformanceAnalyticsMetrics>, 'period_end' | 'period_start'>
  ) {
    super(data);
    this.performance = performance;
  }

  toDto(): Required<IAnalyticsAggregation<IPerformanceAnalyticsMetrics>> {
    return {
      ...super.toDto(),
      metrics: this.metrics
    };
  }
}
