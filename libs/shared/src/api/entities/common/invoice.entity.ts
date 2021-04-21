import { BaseEntity, Entity, Column, ManyToOne, BeforeInsert, PrimaryColumn, OneToOne } from 'typeorm';
import { IInvoice, CurrencyCode, ITicket, PurchaseableEntity, IHostInvoice, PaymentStatus, IUserInvoice } from '@core/interfaces';
import { User } from '../users/user.entity';
import { Host } from '../hosts/host.entity';
import { timestamp, uuid } from '@core/shared/helpers';
import Stripe from 'stripe';
import { Ticket } from '../performances/ticket.entity';
import { PatronSubscription } from '../users/patron-subscription.entity';


@Entity()
export class Invoice extends BaseEntity implements IInvoice {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() {
    this._id = uuid();
  }

  @Column() purchased_at: number;
  @Column('bigint', { nullable: true }) amount: number;
  @Column('enum', { enum: CurrencyCode }) currency: CurrencyCode;
  @Column('enum', { enum: PaymentStatus, nullable: true }) status: PaymentStatus;

  @Column() stripe_charge_id: string;
  @Column() stripe_receipt_url: string;

  @ManyToOne(() => User, user => user.invoices) user: User;
  @ManyToOne(() => Host, host => host.invoices) host?: Host; // purchase was related to a host

  // Exclusive Belongs To (AKA Exclusive Arc) polymorphic relation
  @ManyToOne(() => Ticket)              ticket?: Ticket;
  @ManyToOne(() => PatronSubscription)  patron_subscription?: PatronSubscription;

  constructor(user: User, amount: number, currency: CurrencyCode, charge: Stripe.Charge) {
    super();
    this.user = user;
    this.amount = amount;
    this.currency = currency;
    this.purchased_at = timestamp(new Date());

    this.stripe_charge_id = charge.id;
    this.stripe_receipt_url = charge.receipt_url;
    return this;
  }

  setHost(host: Host) {
    this.host = host;
    return this;
  }

  setTicket(ticket: Ticket) {
    this.ticket = ticket;
    return this;
  }

  toUserInvoice(): Required<IUserInvoice> {
    return {
      invoice_id: this._id,
      performance: this.ticket.performance.toStub(),
      ticket: this.ticket.toStub(),
      amount: this.amount,
      invoice_date: this.purchased_at,
      currency: this.currency,
      receipt_url: this.stripe_receipt_url,
      status: this.status
    };
  }

  toHostInvoice(): Required<IHostInvoice> {
    return {
      invoice_id: this._id,
      performance: this.ticket.performance.toStub(),
      ticket: this.ticket.toStub(),
      amount: this.amount,
      invoice_date: this.purchased_at,
      net_amount: this.amount,
      currency: this.currency,
      status: this.status
    };
  }
}
