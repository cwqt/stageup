import {
  BaseEntity,
  Entity,
  Column,
  ManyToOne,
  BeforeInsert,
  PrimaryColumn,
  DeleteDateColumn,
  JoinColumn,
  OneToOne,
  EntityManager
} from 'typeorm';
import { CurrencyCode, ITicket, ITicketStub, TicketType, DtoCreateTicket, TicketFees, DonoPeg } from '@core/interfaces';
import { uuid } from '@core/helpers';
import { Performance } from './performance.entity';
import { Except } from 'type-fest';
import { Claim } from '../assets/claim.entity';
import { transact } from '../../typeorm-patches';
@Entity()
export class Ticket extends BaseEntity implements ITicket {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() {
    this._id = uuid();
  }

  @Column() name: string;
  @Column() amount: number; // int, in pennies
  @Column() version: number;
  @Column() quantity: number;
  @Column() quantity_remaining: number;
  @Column() is_visible: boolean;
  @Column() is_quantity_visible: boolean;
  @Column() start_datetime: number;
  @Column() end_datetime: number;
  @Column('enum', { enum: CurrencyCode }) currency: CurrencyCode;
  @Column('enum', { enum: TicketType }) type: TicketType;
  @Column('enum', { enum: TicketFees }) fees: TicketFees;
  @Column('varchar', { array: true }) dono_pegs: DonoPeg[];

  @DeleteDateColumn({ type: 'timestamptz' }) deleted_at?: Date; // soft delete
  @ManyToOne(() => Performance, perf => perf.tickets) performance: Performance;
  @OneToOne(() => Claim, { onDelete: 'CASCADE', cascade: true }) @JoinColumn() claim: Claim;

  constructor(ticket: DtoCreateTicket) {
    super();
    this.name = ticket.name;
    this.amount = ticket.type == TicketType.Free ? 0 : ticket.amount;
    this.currency = ticket.currency;
    this.type = ticket.type;
    this.quantity = ticket.quantity;
    this.quantity_remaining = this.quantity;
    this.fees = ticket.fees;
    this.start_datetime = ticket.start_datetime;
    this.end_datetime = ticket.end_datetime;
    this.is_visible = ticket.is_visible;
    this.version = 0;
    this.dono_pegs = ticket.dono_pegs || [];
    this.is_quantity_visible = ticket.is_quantity_visible;
  }

  async setup(performance: Performance, txc?: EntityManager) {
    return transact(async t => {
      this.performance = performance;
      const claim = new Claim();
      this.claim = claim;
      return await t.save(claim);
    }, txc);
  }

  toStub(): Required<ITicketStub> {
    return {
      _id: this._id,
      name: this.name,
      amount: this.amount,
      currency: this.currency,
      quantity: this.quantity,
      type: this.type,
      dono_pegs: this.dono_pegs,
      is_visible: this.is_visible,
      is_quantity_visible: this.is_quantity_visible,
      quantity_remaining:
        // hide ticket quantities other than those that are sold out
        (this.quantity_remaining =
          this.is_quantity_visible == false ? (this.quantity_remaining == 0 ? 0 : null) : this.quantity_remaining)
    };
  }

  toFull(): Required<ITicket> {
    return {
      ...this.toStub(),
      version: this.version,
      fees: this.fees,
      start_datetime: this.start_datetime,
      end_datetime: this.end_datetime
    };
  }

  async update(updates: Except<DtoCreateTicket, 'type'>): Promise<ITicket> {
    Object.entries(updates).forEach(([k, v]: [string, any]) => {
      (this as any)[k] = v ?? (this as any)[k];
    });
    return this.save();
  }
}
