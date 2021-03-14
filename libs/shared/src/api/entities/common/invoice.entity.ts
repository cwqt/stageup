import { BaseEntity, Entity, Column, ManyToOne, BeforeInsert, PrimaryColumn } from 'typeorm';
import { IInvoice, CurrencyCode } from '@core/interfaces';
import { User } from '../users/user.entity';
import { timestamp, uuid } from '@core/shared/helpers';
@Entity()
export class Invoice extends BaseEntity implements IInvoice {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() { this._id = uuid() }

  @Column() purchased_at: number;
  @Column('bigint', { nullable: true }) price: number; // Stored as micro-pence
  @Column('enum', { enum: CurrencyCode }) currency: CurrencyCode;
  @Column() payment_reference: number;

  @ManyToOne(() => User, user => user.invoices) user: User;

  constructor(user: User, price: number, currency:CurrencyCode) {
    super();
    this.user = user;
    this.price = price;
    this.currency = currency;
    this.purchased_at = timestamp(new Date());
  }
}
