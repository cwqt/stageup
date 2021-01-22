import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { IPerformancePurchase, CurrencyCode } from '@eventi/interfaces';
import { User } from './users/user.model';
import { Performance } from './performances/performance.model';
import { unixTimestamp } from '../common/helpers';
@Entity()
export class Purchase extends BaseEntity implements IPerformancePurchase {
  @PrimaryGeneratedColumn() _id: number;
  @Column() purchased_at: number;
  @Column({ type: 'bigint', nullable: true }) price: number; // Stored as micro-pence
  @Column() currency: CurrencyCode;
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
    this.purchased_at = unixTimestamp(new Date());
  }
}
