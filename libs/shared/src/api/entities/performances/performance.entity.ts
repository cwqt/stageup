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
import {
  CurrencyCode,
  DtoCreatePerformance,
  Genre,
  IPerformance,
  IPerformanceStub,
  IRating,
  PerformanceState,
  Visibility
} from '@core/interfaces';

import { PerformanceHostInfo } from './performance-host-info.entity';
import { Host } from '../hosts/host.entity';
import { User } from '../users/user.entity';
import { timestamp, uuid } from '@core/shared/helpers';
import Mux from '@mux/mux-node';
import { Ticket } from './ticket.entity';

@Entity()
export class Performance extends BaseEntity implements IPerformance {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() {
    this._id = uuid();
  }

  @Column() created_at: number;
  @Column() name: string;
  @Column() description?: string;
  @Column() views: number;
  @Column() playback_id: string;
  @Column({ nullable: true }) premiere_date?: number;
  @Column({ nullable: true }) average_rating: number | null;
  @Column('enum', { enum: Visibility, default: Visibility.Private }) visibility: Visibility;
  @Column('enum', { enum: Genre, nullable: true }) genre: Genre;
  @Column('enum', { enum: PerformanceState }) state: PerformanceState;
  @Column() hide_ticket_quantity: boolean;

  @OneToMany(() => Ticket, ticket => ticket.performance) tickets: Ticket[];
  @ManyToOne(() => Host, host => host.performances) host: Host;
  @ManyToOne(() => User, user => user.performances) creator: User;
  @OneToOne(() => PerformanceHostInfo) @JoinColumn() host_info: PerformanceHostInfo;

  constructor(data: DtoCreatePerformance, creator: User) {
    super();
    this.name = data.name;
    this.description = data.description;
    this.premiere_date = data.premiere_date;
    this.genre = data.genre;
    this.tickets = [];

    this.created_at = timestamp(new Date());
    this.views = 0;
    this.average_rating = null;
    this.creator = creator;
    this.host = creator.host;
    this.state = PerformanceState.Idle;
    this.hide_ticket_quantity = false;
  }

  async setup(mux: Mux, txc: EntityManager): Promise<Performance> {
    // Create host info, which includes a signing key, thru atomic trans op
    const [hostInfo, stream] = await new PerformanceHostInfo().setup(mux, txc);
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
      created_at: this.created_at,
      hide_ticket_quantity: this.hide_ticket_quantity
    };
  }

  toFull(): Required<IPerformance> {
    return {
      ...this.toStub(),
      visibility: this.visibility,
      premiere_date: this.premiere_date,
      state: this.state,
      genre: this.genre,
      tickets:
        this.tickets?.map(t => {
          const ticket = t.toStub();
          // hide ticket quantities other than those that are sold out
          ticket.quantity_remaining = this.hide_ticket_quantity
            ? ticket.quantity_remaining == 0
              ? 0
              : null
            : ticket.quantity_remaining;

          return ticket;
        }) || []
    };
  }

  async update(
    updates: Partial<Pick<IPerformance, 'name' | 'description' | 'hide_ticket_quantity'>>
  ): Promise<Performance> {
    Object.entries(updates).forEach(([k, v]: [string, any]) => {
      (this as any)[k] = v ?? (this as any)[k];
    });

    return this.save();
  }
}
