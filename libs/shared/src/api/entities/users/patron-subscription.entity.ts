import { IPatronSubscription } from '@core/interfaces';
import { timestamp, uuid } from '@core/shared/helpers';
import Stripe from 'stripe';
import { BaseEntity, BeforeInsert, Column, Entity, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { Invoice } from '../common/invoice.entity';
import { PatronTier } from '../hosts/patron-tier.entity';
import { User } from './user.entity';

@Entity()
export class PatronSubscription extends BaseEntity implements IPatronSubscription {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() {
    this._id = this._id || uuid();
  }

  @Column() created_at: number;
  @Column() last_renewed: number;
  @Column() renewal_count: number;
  @Column() stripe_subscription_id: string;

  @ManyToOne(() => User, user => user.patron_subcriptions) user: User;
  @OneToMany(() => Invoice, invoice => invoice.patron_subscription) invoices: Invoice[];
  @ManyToOne(() => PatronTier, tier => tier.subscribers) patron_tier: PatronTier;

  constructor(subscription: Stripe.Subscription, user: User, tier: PatronTier) {
    super();
    this.patron_tier = tier;
    this.stripe_subscription_id = subscription.id;
    this.user = user;
    this.created_at = timestamp();
    this.last_renewed = timestamp();
    this.renewal_count = 1;
  }

  toFull(): Required<IPatronSubscription> {
    return {
      _id: this._id,
      created_at: this.created_at,
      last_renewed: this.last_renewed,
      renewal_count: this.renewal_count,
      patron_tier: this.patron_tier.toFull(),
      stripe_subscription_id: this.stripe_subscription_id
    };
  }
}
