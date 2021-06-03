import { BaseEntity, Entity, Column, ManyToOne, BeforeInsert, PrimaryColumn, OneToOne } from 'typeorm';
import {
  IInvoice,
  CurrencyCode,
  ITicket,
  PurchaseableType,
  PaymentStatus,
  DtoInvoice,
  IUserInvoice,
  IUserInvoiceStub,
  IHostInvoiceStub,
  IHostInvoice,
  IPaymentSourceDetails,
  RefundReason,
  IRefundRequest
} from '@core/interfaces';
import { User } from '../users/user.entity';
import { Host } from '../hosts/host.entity';
import { timestamp, uuid } from '@core/helpers';
import Stripe from 'stripe';
import { Ticket } from '../performances/ticket.entity';
import { PatronSubscription } from '../users/patron-subscription.entity';
import { PatronTier, PaymentMethod } from '@core/api';

export type PurchaseableEntity = PatronSubscription | Ticket;

@Entity()
export class Invoice extends BaseEntity implements IInvoice {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() {
    this._id = uuid();
  }

  @Column() purchased_at: number;
  @Column('bigint') amount: number;
  @Column('enum', { enum: CurrencyCode }) currency: CurrencyCode;
  @Column('enum', { enum: PaymentStatus, default: PaymentStatus.Created }) status: PaymentStatus;
  @Column('enum', { enum: PurchaseableType, nullable: true }) type: PurchaseableType;
  @Column('json', { nullable: true }) refund_request: Omit<IRefundRequest, 'invoice_id'>;

  @Column() stripe_payment_intent_id: string;
  @Column() stripe_receipt_url: string;

  @ManyToOne(() => User, user => user.invoices) user: User;
  @ManyToOne(() => Host, host => host.invoices) host?: Host; // purchase was related to a host

  // Exclusive Belongs To (AKA Exclusive Arc) polymorphic relation
  @ManyToOne(() => Ticket) ticket?: Ticket;
  @ManyToOne(() => PatronSubscription) patron_subscription?: PatronSubscription;

  constructor(user: User, amount: number, currency: CurrencyCode, intent: Stripe.PaymentIntent) {
    super();
    this.user = user;
    this.amount = amount;
    this.currency = currency;
    this.purchased_at = timestamp();

    this.stripe_payment_intent_id = intent.id;
    this.stripe_receipt_url = intent.charges.data[0].receipt_url;
    return this;
  }

  setHost(host: Host) {
    this.host = host;
    return this;
  }

  setPurchaseable(entity: PurchaseableEntity) {
    if (entity instanceof Ticket) {
      this.ticket = entity;
      this.type = PurchaseableType.Ticket;
    } else if (entity instanceof PatronSubscription) {
      this.patron_subscription = entity;
      this.type = PurchaseableType.PatronTier;
    }

    return this;
  }

  toPaymentSourceDetails(intent: Stripe.PaymentIntent): Required<IPaymentSourceDetails> {
    return {
      last_4_digits: (intent.payment_method as Stripe.PaymentMethod).card.last4,
      card_type: (intent.payment_method as Stripe.PaymentMethod).card.brand
    };
  }

  // Shared Invoice interface -------------------------------------------------
  toDtoInvoice(): Required<DtoInvoice> {
    return {
      invoice_id: this._id,
      invoice_date: this.purchased_at,
      status: this.status,
      amount: this.amount,
      currency: this.currency
    };
  }

  // User Invoice -------------------------------------------------
  toUserInvoiceStub(): Required<IUserInvoiceStub> {
    return {
      ...this.toDtoInvoice(),
      performance: this.ticket.performance.toStub(),
      ticket: this.ticket.toStub()
    };
  }

  toUserInvoice(intent: Stripe.PaymentIntent): Required<IUserInvoice> {
    return {
      ...this.toUserInvoiceStub(),
      ...this.toPaymentSourceDetails(intent),
      receipt_url: this.stripe_receipt_url
    };
  }

  // Host Invoice -------------------------------------------------
  toHostInvoiceStub(): Required<IHostInvoiceStub> {
    return {
      ...this.toDtoInvoice(),
      performance: this.ticket.performance.toStub(),
      ticket: this.ticket.toStub(),
      net_amount: this.amount
    };
  }

  toHostInvoice(intent: Stripe.PaymentIntent): Required<IHostInvoice> {
    return {
      ...this.toHostInvoiceStub(),
      ...this.toPaymentSourceDetails(intent),
      user: this.user.toStub(),
      receipt_url: this.stripe_receipt_url
    };
  }
}
