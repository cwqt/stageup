import {
  AssetType,
  DtoCreatePerformance,
  Genre,
  IPerformance,
  IPerformanceStub,
  Visibility,
} from '@core/interfaces';
import { timestamp, uuid } from '@core/shared/helpers';
import Mux from '@mux/mux-node';
import { Except } from 'type-fest';
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
import { AssetGroup } from '../common/asset-group.entity';
import { Asset } from '../common/asset.entity';
import { Host } from '../hosts/host.entity';
import { Ticket } from './ticket.entity';

@Entity()
export class Performance extends BaseEntity implements Except<IPerformance, 'stream'> {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() {
    this._id = uuid();
  }

  @Column() created_at: number;
  @Column() name: string;
  @Column() description?: string;
  @Column() views: number;
  @Column({ nullable: true }) premiere_date?: number;
  @Column({ nullable: true }) average_rating: number | null;
  @Column('enum', { enum: Visibility, default: Visibility.Private }) visibility: Visibility;
  @Column('enum', { enum: Genre, nullable: true }) genre: Genre;

  @OneToOne(() => Asset) @JoinColumn() stream: Asset<AssetType.LiveStream>;
  @OneToOne(() => AssetGroup) @JoinColumn() assetGroup: AssetGroup;
  @OneToMany(() => Ticket, ticket => ticket.performance) tickets: Ticket[];
  @ManyToOne(() => Host, host => host.performances) host: Host;

  constructor(data: DtoCreatePerformance, host: Host) {
    super();
    this.name = data.name;
    this.description = data.description;
    this.premiere_date = data.premiere_date;
    this.genre = data.genre;
    this.tickets = [];

    this.created_at = timestamp(new Date());
    this.views = 0;
    this.average_rating = null;
    this.host = host;
  }

  async setup(mux: Mux, txc: EntityManager): Promise<Performance> {
    this.assetGroup = new AssetGroup();
    const stream = await new Asset(AssetType.LiveStream).setup(mux, txc);
    this.stream = stream;

    this.assetGroup.push(stream);
    await txc.save(this.assetGroup);
    return txc.save(this);
  }

  toStub(): Required<IPerformanceStub> {
    return {
      _id: this._id,
      host: this.host?.toStub(),
      name: this.name,
      average_rating: this.average_rating,
      views: this.views,
      description: this.description,
      created_at: this.created_at,
      stream: { state: this.stream.meta.state, location: this.stream.location }
    };
  }

  toFull(): Required<IPerformance> {
    return {
      ...this.toStub(),
      visibility: this.visibility,
      premiere_date: this.premiere_date,
      genre: this.genre,
      tickets: this.tickets?.map(t => t.toStub()) || []
    };
  }

  async update(
    updates: Partial<Pick<IPerformance, 'name' | 'description'>>
  ): Promise<Performance> {
    Object.entries(updates).forEach(([k, v]: [string, any]) => {
      (this as any)[k] = v ?? (this as any)[k];
    });

    return this.save();
  }
}
