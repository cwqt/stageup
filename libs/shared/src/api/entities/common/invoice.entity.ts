import { BaseEntity, Entity, Column, ManyToOne, BeforeInsert, PrimaryColumn } from 'typeorm';
import { IInvoice, CurrencyCode } from '@core/interfaces';
import { User } from '../users/user.entity';
import { timestamp, uuid } from '@core/shared/helpers';
import Stripe from 'stripe';
@Entity()
export class Invoice extends BaseEntity implements IInvoice {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() { this._id = uuid() }

  @Column() purchased_at: number;
  @Column('bigint', { nullable: true }) amount: number;
  @Column('enum', { enum: CurrencyCode }) currency: CurrencyCode;
  @Column() stripe_charge_id: string;
  @Column() stripe_receipt_url: string;

  @ManyToOne(() => User, user => user.invoices) user: User;

  constructor(user: User, amount: number, currency:CurrencyCode, charge:Stripe.Charge) {
    super();
    this.user = user;
    this.amount = amount;
    this.currency = currency;
    this.purchased_at = timestamp(new Date());

    this.stripe_charge_id = charge.id;
    this.stripe_receipt_url = charge.receipt_url;
  }
}
