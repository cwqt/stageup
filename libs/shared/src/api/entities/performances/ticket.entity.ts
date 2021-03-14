import { BaseEntity, Entity, Column, ManyToOne, BeforeInsert, PrimaryColumn, DeleteDateColumn } from 'typeorm';
import { CurrencyCode, ITicket, ITicketStub, TicketType, DtoCreateTicket, TicketFees } from '@core/interfaces';
import { uuid } from '@core/shared/helpers';
import { Performance } from './performance.entity';
@Entity()
export class Ticket extends BaseEntity implements ITicket {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() { this._id = uuid() }

  @Column() name: string;
  @Column() price: number;
  @Column() version: number;
  @Column() quantity: number;
  @Column() is_visible: boolean;
  @Column() start_datetime: number;
  @Column() end_datetime: number;
  @Column('enum', { enum: CurrencyCode }) currency: CurrencyCode;
  @Column('enum', { enum: TicketType }) type: TicketType;
  @Column('enum', { enum: TicketFees }) fees: TicketFees;

  @DeleteDateColumn({ type: "timestamptz" }) deleted_at?: Date; // soft delete
  @ManyToOne(() => Performance, perf => perf.tickets) performance: Performance;

  constructor(ticket:DtoCreateTicket) {
    super();
    this.name = ticket.name;
    this.price = ticket.type == TicketType.Free ? 0 : ticket.price;
    this.currency = ticket.currency;
    this.type = ticket.type;
    this.quantity = ticket.quantity;
    this.fees = ticket.fees;
    this.start_datetime = ticket.start_datetime;
    this.end_datetime = ticket.end_datetime
    this.is_visible = ticket.is_visible;
    this.version = 0;
  }

  toStub():Required<ITicketStub> {
    return {
      _id: this._id,
      name: this.name,
      price: this.price,
      currency: this.currency,
      quantity: this.quantity,
      type: this.type
    }
  }

  toFull():Required<ITicket> {
    return {
      ...this.toStub(),
      version: this.version,
      fees: this.fees,
      is_visible: this.is_visible,
      start_datetime: this.start_datetime,
      end_datetime: this.end_datetime
    }
  }
}
