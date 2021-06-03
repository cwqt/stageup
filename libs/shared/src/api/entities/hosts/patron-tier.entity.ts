import {
  CurrencyCode,
  DtoCreatePatronTier,
  IHostPatronTier,
  IPatronTier,
  RichText,
  PurchaseableType
} from '@core/interfaces';
import { readRichTextContent, timestamp, uuid } from '@core/helpers';
import Stripe from 'stripe';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  DeleteDateColumn,
  Entity,
  EntityManager,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  RelationId
} from 'typeorm';
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
  @Column('varchar', { nullable: true }) description: RichText; // quilljs operation array
  @Column('enum', { enum: CurrencyCode }) currency: CurrencyCode;
  @Column() stripe_price_id: string; // price_H1y51TElsOZjG or similar
  @Column() stripe_product_id: string; // prod_JKwzPhILewYZAC or similar

  @RelationId((tier: PatronTier) => tier.host) host__id: string;
  @ManyToOne(() => Host, host => host.patron_tiers) host: Host;

  @OneToMany(() => PatronSubscription, sub => sub.patron_tier) subscribers: PatronSubscription[];

  @DeleteDateColumn() deleted_at?: Date;

  constructor(data: DtoCreatePatronTier, host: Host) {
    super();
    this.name = data.name;
    this.description = data.description;
    this.amount = data.amount;
    this.currency = data.currency;
    this.host = host;

    this.is_visible = false;
    this.total_patrons = 0;
    this.version = 0;
    this.created_at = timestamp();
  }

  /**
   * @description Creates the Patron Tiers' Subscription & Price in Stripe & saves to DB
   */
  async setup(stripe: Stripe, txc: EntityManager): Promise<PatronTier> {
    // Create _id now so that we can reference it in the price passthrough data
    this._id = uuid();

    // Create a product & price, stored on the hosts Connected account
    const product = await stripe.products.create(
      {
        name: this.name,
        description: readRichTextContent(this.description),
        metadata: {
          host_id: this.host._id,
          purchaseable_type: PurchaseableType.PatronTier,
          purchasable_id: this._id
        }
      },
      { stripeAccount: this.host.stripe_account_id }
    );

    // https://stripe.com/docs/billing/subscriptions/fixed-price
    const price = await stripe.prices.create(
      {
        unit_amount: this.amount,
        currency: this.currency,
        product: product.id,
        recurring: {
          interval: 'month'
        },
        metadata: {
          host_id: this.host._id,
          purchaseable_type: PurchaseableType.PatronTier,
          purchasable_id: this._id
        }
      },
      { stripeAccount: this.host.stripe_account_id }
    );

    this.stripe_price_id = price.id;
    this.stripe_product_id = product.id;

    return txc.save(this);
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
