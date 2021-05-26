import { IPatronSubscription, NUUID, PatronSubscriptionStatus } from '@core/interfaces';
import { timestamp, uuid } from '@core/helpers';
import Stripe from 'stripe';
import { BaseEntity, BeforeInsert, Column, Entity, ManyToOne, OneToMany, PrimaryColumn, RelationId } from 'typeorm';
import { Invoice } from '../common/invoice.entity';
import { PatronTier } from '../hosts/patron-tier.entity';
import { User } from './user.entity';

@Entity()
export class PatronSubscription extends BaseEntity implements IPatronSubscription {
  @PrimaryColumn() _id: string;

  @Column() created_at: number;
  @Column() last_renewal_date: number;
  @Column() next_renewal_date: number;
  @Column() renewal_count: number;
  @Column() stripe_subscription_id: string;
  @Column('enum', { enum: PatronSubscriptionStatus }) status: PatronSubscriptionStatus;

  @ManyToOne(() => User, user => user.patron_subcriptions) user: User;
  @OneToMany(() => Invoice, invoice => invoice.patron_subscription) invoices: Invoice[];

  @RelationId((sub: PatronSubscription) => sub.patron_tier) patron_tier__id: NUUID;
  @ManyToOne(() => PatronTier, tier => tier.subscribers) patron_tier: PatronTier;

  constructor(subscription: Stripe.Subscription, user: User, tier: PatronTier) {
    super();
    this._id = uuid();
    this.patron_tier = tier;
    this.stripe_subscription_id = subscription.id;
    this.user = user;
    this.created_at = timestamp();
    this.last_renewal_date = timestamp();
    this.next_renewal_date = subscription.current_period_end;
    this.status = PatronSubscriptionStatus.Active;
    this.renewal_count = 1;
  }

  toFull(): Required<IPatronSubscription> {
    return {
      _id: this._id,
      created_at: this.created_at,
      last_renewal_date: this.last_renewal_date,
      next_renewal_date: this.last_renewal_date,
      renewal_count: this.renewal_count,
      patron_tier: this.patron_tier.toFull(),
      stripe_subscription_id: this.stripe_subscription_id,
      status: this.status
    };
  }
}
