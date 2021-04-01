import { BaseEntity, Entity, Column, ManyToOne, BeforeInsert, PrimaryColumn, OneToOne } from 'typeorm';
import { IInvoice, CurrencyCode, ITicket, PurchaseableEntity, IHostInvoice, PaymentStatus } from '@core/interfaces';
import { User } from '../users/user.entity';
import { Host } from '../hosts/host.entity';
import { enumToValues, timestamp, uuid } from '@core/shared/helpers';
import Stripe from 'stripe';
import { Ticket } from '../performances/ticket.entity';

@Entity()
export class Invoice extends BaseEntity implements IInvoice {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() {
    this._id = uuid();
  }

  @Column() purchased_at: number;
  @Column('bigint', { nullable: true }) amount: number;
  @Column('enum', { enum: CurrencyCode }) currency: CurrencyCode;
  @Column() stripe_charge_id: string;
  @Column() stripe_receipt_url: string;

  @ManyToOne(() => User, user => user.invoices) user: User;
  @ManyToOne(() => Host, host => host.invoices) host?: Host; // purchase was related to a host

  @ManyToOne(() => Ticket) ticket: Ticket;

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

  toHostInvoice(): Required<IHostInvoice> {
    return {
      invoice_id: this._id,
      performance: this.ticket.performance.toStub(),
      ticket: this.ticket.toStub(),
      amount: this.amount,
      invoice_date: this.purchased_at,
      net_amount: this.amount,
      status: (() => {
				// IMPORTANT: handle stripe webhooks for setting this state, purposes of demoing
        const arr = enumToValues(PaymentStatus);
        return arr[Math.floor(Math.random() * arr.length)] as PaymentStatus;
      })()
    };
  }
}
