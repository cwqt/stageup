import { uuid } from '@core/helpers';
import { EntityMetric, IAnalyticsChunk } from '@core/interfaces';
import { Except } from 'type-fest';
import { BaseEntity, BeforeInsert, Column, Entity, PrimaryColumn, TableInheritance } from 'typeorm';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class AnalyticsChunk<T extends EntityMetric> extends BaseEntity implements IAnalyticsChunk<T> {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() {
    this._id = uuid();
  }

  @Column() period_started_at: number;
  @Column() period_ended_at: number;
  @Column() collection_started_at: number;
  @Column() collection_ended_at: number;
  @Column('json') metrics: T;

  constructor() {
    super();
  }

  setup(data: Pick<IAnalyticsChunk<T>, 'period_ended_at' | 'period_started_at'>) {
    this.period_started_at = data.period_started_at;
    this.period_ended_at = data.period_ended_at;
  }

  toDto(): Required<Except<IAnalyticsChunk<T>, 'metrics'>> {
    return {
      _id: this._id,
      period_ended_at: this.period_ended_at,
      period_started_at: this.period_started_at,
      collection_ended_at: this.collection_ended_at,
      collection_started_at: this.collection_ended_at
    };
  }
}
