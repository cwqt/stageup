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
  Visibility,
  IRemovalReason,
  PerformanceType
} from '@core/interfaces';
import { Except } from 'type-fest';
import {
  BaseEntity,
  Column,
  DeleteDateColumn,
  Entity,
  EntityManager,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn
} from 'typeorm';
import { AssetGroup } from '../assets/asset-group.entity';
import { Host } from '../hosts/host.entity';
import { Ticket } from './ticket.entity';

@Entity()
export class Performance extends BaseEntity implements Except<IPerformance, 'assets'> {
  @PrimaryColumn() _id: string;

  @Column() created_at: number;
  @Column() name: string;
  @Column() views: number;
  @Column({ unsigned: true, default: 0 }) like_count: number;
  @Column({ nullable: true }) premiere_datetime?: number;
  @Column('enum', { enum: PerformanceType, nullable: true }) performance_type: PerformanceType;
  @Column({ unsigned: true, default: 0 }) rating_count: number;
  @Column('float', {default: 0 }) rating_total: number;
  @Column('jsonb', { nullable: true }) description?: RichText;
  @Column('varchar', { nullable: true }) thumbnail: string;
  @Column('enum', { enum: Visibility, default: Visibility.Private }) visibility: Visibility;
  @Column('enum', { enum: Genre, nullable: true }) genre: Genre;
  @Column('enum', { enum: PerformanceStatus, default: PerformanceStatus.PendingSchedule }) status: PerformanceStatus;
  @Column('jsonb', { default: { start: null, end: null } }) publicity_period: { start: number; end: number };

  @DeleteDateColumn() deletedAt?: Date;
  @Column('jsonb', { nullable: true }) removal_reason: IRemovalReason;

  @OneToOne(() => AssetGroup, { eager: true, onDelete: 'CASCADE', cascade: true })
  @JoinColumn()
  asset_group: AssetGroup;
  @OneToMany(() => Ticket, ticket => ticket.performance, { onDelete: 'CASCADE', cascade: true }) tickets: Ticket[];
  @ManyToOne(() => Host, host => host.performances) host: Host;
  @OneToMany(() => Like, like => like.performance, { onDelete: 'CASCADE', cascade: true }) likes: Like[];

  constructor(data: DtoCreatePerformance, host: Host) {
    super();
    this._id = uuid();
    this.name = data.name;
    this.description = data.description;
    this.genre = data.genre;
    this.tickets = [];

    // Defaults
    this.status = data.publicity_period.start ? PerformanceStatus.Scheduled : PerformanceStatus.PendingSchedule;
    this.created_at = timestamp(new Date());
    this.views = 0;
    this.like_count = 0;
    this.rating_count = 0;
    this.rating_total = 0;
    this.host = host;
    this.publicity_period = { start: data.publicity_period.start, end: data.publicity_period.end };
    this.performance_type = data.type;
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
      publicity_period: this.publicity_period,
      assets: this.asset_group?.assets.map(a => a.toStub()),
      status: this.status,
      performance_type: this.performance_type,
      visibility: this.visibility
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
      // Filter out any old/cancelled tickets
      tickets: this.tickets?.filter(t => !t.is_cancelled).map(t => t.toStub()) || [],
      publicity_period: this.publicity_period,
      performance_type: this.performance_type
    };
  }

  async update(updates: Partial<Pick<IPerformance, 'name' | 'description'>>): Promise<Performance> {
    Object.entries(updates).forEach(([k, v]: [string, any]) => {
      (this as any)[k] = v ?? (this as any)[k];
    });

    return this.save();
  }
}
