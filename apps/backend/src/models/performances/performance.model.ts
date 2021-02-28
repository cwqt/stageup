import {
  BaseEntity,
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn
} from 'typeorm';
import { CurrencyCode, Genre, IPerformance, IPerformanceStub, IRating, PerformanceState } from '@core/interfaces';

import { PerformanceHostInfo as PHostInfo, PerformanceHostInfo } from './performance-host-info.model';
import { Host } from '../hosts/host.model';
import { User } from '../users/user.model';
import { DataClient } from '../../common/data';
import { PerformancePurchase } from '../performances/purchase.model';
import { timestamp, uuid } from '../../common/helpers';

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
  @Column('enum', { enum: Genre, nullable: true }) genre: Genre;
  @Column('enum', { enum: PerformanceState }) state: PerformanceState;
  @Column('enum', { enum: CurrencyCode }) currency: CurrencyCode;

  @OneToOne(() => PHostInfo) @JoinColumn() host_info: PHostInfo;
  @ManyToOne(() => Host, host => host.performances) host: Host;
  @ManyToOne(() => User, user => user.performances) creator: User;
  @OneToMany(() => PerformancePurchase, purchase => purchase.performance) purchases: PerformancePurchase[];

  ratings: IRating[];

  constructor(
    data: Pick<IPerformanceStub, 'name' | 'description'> & Pick<IPerformance, 'price' | 'currency'>,
    creator: User
  ) {
    super();
    this.name = data.name;
    this.description = data.description;
    this.price = data.price;
    this.currency = data.currency;

    this.created_at = timestamp(new Date());
    this.views = 0;
    this.average_rating = null;
    this.creator = creator;
    this.host = creator.host;
    this.state = PerformanceState.Idle;
  }

  async setup(dc: DataClient): Promise<Performance> {
    // Create host info, which includes a signing key, thru atomic trans op
    await dc.torm.transaction(async transEntityManager => {
      const [hostInfo, stream] = await new PerformanceHostInfo().setup(dc, transEntityManager);
      this.host_info = hostInfo;
      this.playback_id = stream.playback_ids.find(p => p.policy === 'signed').id;

      await transEntityManager.save(this);
    });

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
      playback_id: this.playback_id
    };
  }

  toFull(): Required<IPerformance> {
    return {
      ...this.toStub(),
      created_at: this.created_at,
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
