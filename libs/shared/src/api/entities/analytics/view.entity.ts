import { timestamp, uuid } from '@core/helpers';
import { IView, NUUID } from '@core/interfaces';
import { BaseEntity, ChildEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class AssetView extends BaseEntity implements IView {
  @PrimaryColumn() _id: string;

  @Column('varchar') user__id: NUUID;
  @Column('varchar') asset__id: NUUID;
  @Column('varchar') performance__id: NUUID;

  @Column() viewed_at: number;

  constructor(userId: string, assetId: string, performanceId: string) {
    super();
    this._id = uuid();
    this.user__id = userId;
    this.asset__id = assetId;
    this.performance__id = performanceId;
    this.viewed_at = timestamp();
  }
}
