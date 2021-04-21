import { CurrencyCode, DtoCreatePatronTier, IHostPatronTier, IPatronTier } from '@core/interfaces';
import { timestamp, uuid } from '@core/shared/helpers';
import Stripe from 'stripe';
import { BaseEntity, BeforeInsert, Column, Entity, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { PatronSubscription } from '../users/patron-subscription.entity';
import { Host } from './host.entity';

@Entity()
export class PatronTier extends BaseEntity implements IHostPatronTier {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() {
    this._id = this._id || uuid();
  }

  @Column() name: string;
  @Column() created_at: number;
  @Column({ nullable: true }) cover_image: string;
  @Column() version: number;
  @Column() amount: number;
  @Column() total_patrons: number; // de-normalised col that gets adjusted on user buying/removing patronage
  @Column() is_visible: boolean;
  @Column('jsonb', { nullable: true }) description: Array<any>; // quilljs operation array
  @Column('enum', { enum: CurrencyCode }) currency: CurrencyCode;
  @Column() stripe_price_id: string; // price_H1y51TElsOZjG or similar
  @Column() stripe_product_id: string; // prod_JKwzPhILewYZAC or similar

  @ManyToOne(() => Host, host => host.patron_tiers) host: Host;
  @OneToMany(() => PatronSubscription, sub => sub.patron_tier) subscribers: PatronSubscription[];

  constructor(data: DtoCreatePatronTier, host: Host, price: Stripe.Price, product: Stripe.Product) {
    super();
    this.name = data.name;
    this.description = data.description;
    this.amount = data.amount;
    this.currency = data.currency;
    this.host = host;

    this.stripe_price_id = price.id;
    this.stripe_product_id = product.id;

    this.is_visible = false;
    this.total_patrons = 0;
    this.version = 0;
    this.created_at = timestamp();
  }

  toFull(): Required<IPatronTier> {
    return {
      _id: this._id,
      name: this.name,
      description: this.description,
      created_at: this.created_at,
      cover_image: this.cover_image,
      currency: this.currency,
      amount: this.amount
    };
  }

  toHost(): Required<IHostPatronTier> {
    return {
      ...this.toFull(),
      total_patrons: this.total_patrons,
      is_visible: this.is_visible,
      version: this.version,
      stripe_price_id: this.stripe_price_id,
      stripe_product_id: this.stripe_product_id
    };
  }
}
