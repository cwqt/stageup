import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne, BeforeInsert, PrimaryColumn } from 'typeorm';
import { IPerformancePurchase, CurrencyCode } from '@core/interfaces';
import { User } from '../users/user.model';
import { Performance } from './performance.model';
import { timestamp, uuid } from '@core/shared/helpers';
@Entity()
export class PerformancePurchase extends BaseEntity implements IPerformancePurchase {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() { this._id = uuid() }

  @Column() purchased_at: number;
  @Column('bigint', { nullable: true }) price: number; // Stored as micro-pence
  @Column('enum', { enum: CurrencyCode }) currency: CurrencyCode;
  @Column() token: string;
  @Column() payment_id: number;
  @Column() expiry: number;
  @Column() key_id: string; // Signing-key

  @ManyToOne(() => User, user => user.purchases) user: User;
  @ManyToOne(() => Performance, perf => perf.purchases) performance: Performance;

  constructor(user: User, performance: Performance) {
    super();
    this.user = user;
    this.performance = performance;
    this.price = performance.price;
    this.currency = performance.currency;
    this.purchased_at = timestamp(new Date());
  }
}
