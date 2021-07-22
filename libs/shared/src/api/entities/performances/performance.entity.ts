import { Like } from './../users/like.entity';
import { timestamp, uuid } from '@core/helpers';
import {
  DtoCreatePerformance,
  Genre,
  IPerformance,
  IPerformanceStub,
  IFeedPerformanceStub,
  PerformanceStatus,
  RichText,
  Visibility
} from '@core/interfaces';
import { Except } from 'type-fest';
import {
  BaseEntity,
  Column,
  Entity,
  EntityManager,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn
} from 'typeorm';
import { AssetGroup } from '../common/asset-group.entity';
import { Host } from '../hosts/host.entity';
import { Ticket } from './ticket.entity';

@Entity()
export class Performance extends BaseEntity implements Except<IPerformance, 'assets'> {
  @PrimaryColumn() _id: string;

  @Column() created_at: number;
  @Column() name: string;
  @Column() views: number;
  @Column({ unsigned: true }) like_count: number;
  @Column({ nullable: true }) premiere_datetime?: number;
  @Column({ unsigned: true }) rating_count: number;
  @Column('float') rating_total: number;
  @Column('jsonb', { nullable: true }) description?: RichText;
  @Column('varchar', { nullable: true }) thumbnail: string;
  @Column('enum', { enum: Visibility, default: Visibility.Private }) visibility: Visibility;
  @Column('enum', { enum: Genre, nullable: true }) genre: Genre;
  @Column('enum', { enum: PerformanceStatus, default: PerformanceStatus.PendingSchedule }) status: PerformanceStatus;
  @Column('jsonb', { default: { start: null, end: null } }) publicity_period: { start: number; end: number };

  @OneToOne(() => AssetGroup, { eager: true }) @JoinColumn() asset_group: AssetGroup;
  @OneToMany(() => Ticket, ticket => ticket.performance) tickets: Ticket[];
  @ManyToOne(() => Host, host => host.performances) host: Host;
  @OneToMany(() => Like, like => like.performance) likes: Like[];

  constructor(data: DtoCreatePerformance, host: Host) {
    super();
    this._id = uuid();
    this.name = data.name;
    this.description = data.description;
    this.premiere_datetime = data.premiere_datetime;
    this.genre = data.genre;
    this.tickets = [];

    // Defaults
    this.status = PerformanceStatus.PendingSchedule;
    this.created_at = timestamp(new Date());
    this.views = 0;
    this.like_count = 0;
    this.rating_count = 0;
    this.rating_total = 0;
    this.host = host;
    this.publicity_period = { start: null, end: null };
  }

  async setup(txc: EntityManager): Promise<Performance> {
    const group = new AssetGroup(this._id);
    await txc.save(group);

    this.asset_group = group;
    return txc.save(this);
  }

  toStub(): Required<IPerformanceStub> {
    return {
      _id: this._id,
      host: this.host?.toStub(),
      name: this.name,
      rating_count: this.rating_count,
      rating_total: this.rating_total,
      views: this.views,
      like_count: this.like_count,
      description: this.description,
      created_at: this.created_at,
      thumbnail: this.thumbnail,
      premiere_datetime: this.premiere_datetime,
      assets: this.asset_group.assets.map(a => a.toStub()),
      status: this.status
    };
  }

  toClientStub(): Required<IFeedPerformanceStub> {
    return {
      ...this.toStub(),
      client_likes: this.likes?.length > 0 ? true : false // If client has liked this performance, set to true
    };
  }

  toFull(): Required<IPerformance> {
    return {
      ...this.toStub(),
      visibility: this.visibility,
      genre: this.genre,
      tickets: this.tickets?.map(t => t.toStub()) || [],
      publicity_period: this.publicity_period
    };
  }

  async update(updates: Partial<Pick<IPerformance, 'name' | 'description'>>): Promise<Performance> {
    Object.entries(updates).forEach(([k, v]: [string, any]) => {
      (this as any)[k] = v ?? (this as any)[k];
    });

    return this.save();
  }
}
