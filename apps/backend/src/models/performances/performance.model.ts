import {
  BaseEntity,
  BeforeInsert,
  Column,
  Entity,
  EntityManager,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn
} from 'typeorm';
import { CurrencyCode, DtoCreatePerformance, Genre, IPerformance, IPerformanceStub, IRating, PerformanceState, Visibility } from '@core/interfaces';

import { PerformanceHostInfo } from './performance-host-info.model';
import { Host } from '../hosts/host.model';
import { User } from '../users/user.model';
import { PerformancePurchase } from '../performances/purchase.model';
import { timestamp, uuid } from '@core/shared/helpers';
import { DataConnections } from '@core/shared/api';
import { BackendDataClient } from '../../common/data';

@Entity()
export class Performance extends BaseEntity implements IPerformance {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() { this._id = uuid() }

  @Column() created_at: number;
  @Column() name: string;
  @Column() description?: string;
  @Column() views: number;
  @Column() price: number;
  @Column() playback_id: string;
  @Column({ nullable: true }) premiere_date?: number;
  @Column({ nullable: true }) average_rating: number | null;
  @Column({ default: true }) is_private: boolean;
  @Column('enum', { enum: Visibility, default: Visibility.Private }) visibility: Visibility;
  @Column('enum', { enum: Genre, nullable: true }) genre: Genre;
  @Column('enum', { enum: PerformanceState }) state: PerformanceState;
  @Column('enum', { enum: CurrencyCode }) currency: CurrencyCode;

  @ManyToOne(() => Host, host => host.performances) host: Host;
  @ManyToOne(() => User, user => user.performances) creator: User;
  @OneToOne(() =>  PerformanceHostInfo) @JoinColumn() host_info: PerformanceHostInfo;
  @OneToMany(() => PerformancePurchase, purchase => purchase.performance) purchases: PerformancePurchase[];

  ratings: IRating[];

  constructor(
    data: DtoCreatePerformance,
    creator: User
  ) {
    super();
    this.name = data.name;
    this.description = data.description;
    this.price = data.price;
    this.currency = data.currency;
    this.premiere_date = data.premiere_date;
    this.genre = data.genre;

    this.created_at = timestamp(new Date());
    this.views = 0;
    this.average_rating = null;
    this.creator = creator;
    this.host = creator.host;
    this.state = PerformanceState.Idle;
  }

  async setup(dc: DataConnections<BackendDataClient>, txc:EntityManager): Promise<Performance> {
    // Create host info, which includes a signing key, thru atomic trans op
    const [hostInfo, stream] = await new PerformanceHostInfo().setup(dc, txc);
    this.host_info = hostInfo;
    this.playback_id = stream.playback_ids.find(p => p.policy === 'signed').id;

    return this;
  }

  toStub(): Required<IPerformanceStub> {
    return {
      _id: this._id,
      host: this.host?.toStub(),
      name: this.name,
      average_rating: this.average_rating,
      views: this.views,
      description: this.description,
      playback_id: this.playback_id,
      created_at: this.created_at
    };
  }

  toFull(): Required<IPerformance> {
    return {
      ...this.toStub(),
      visibility: this.visibility,
      premiere_date: this.premiere_date,
      ratings: this.ratings,
      state: this.state,
      price: this.price,
      currency: this.currency,
      genre: this.genre,
      is_private: this.is_private
    };
  }

  async update(updates: Partial<Pick<IPerformance, 'name' | 'description' | 'price'>>): Promise<Performance> {
    Object.entries(updates).forEach(([k, v]: [string, any]) => {
      (this as any)[k] = v ?? (this as any)[k];
    });

    return this.save();
  }
}
