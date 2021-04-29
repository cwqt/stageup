import { timestamp, uuid } from '@core/helpers';
import { CardBrand, IPaymentMethod, IPaymentMethodStub } from '@core/interfaces';
import Stripe from 'stripe';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  DeleteDateColumn,
  Entity,
  EntityManager,
  ManyToOne,
  PrimaryColumn
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class PaymentMethod extends BaseEntity implements IPaymentMethod {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() {
    this._id = uuid();
  }

  @Column() stripe_method_id: string;
  @Column() is_primary: boolean;
  @Column() created_at: number;
  @Column() last4: string;
  @Column({ nullable: true }) last_used_at: number;
  @Column('enum', { enum: CardBrand }) brand: CardBrand;
  @Column('jsonb') billing_details: IPaymentMethod['billing_details'];
  @DeleteDateColumn({ type: 'timestamptz' }) deleted_at?: Date; // soft delete

  @ManyToOne(() => User, user => user.payment_methods) user: User;

  constructor(method: Stripe.PaymentMethod, user: User, isPrimary: boolean = false) {
    super();
    this.stripe_method_id = method.id;
    this.last4 = method.card.last4;
    this.brand = method.card.brand as CardBrand;
    this.created_at = timestamp();
    this.billing_details = method.billing_details;
    this.user = user;
    this.is_primary = isPrimary;
  }

  async delete(stripe: Stripe, txc: EntityManager) {
    await stripe.paymentMethods.detach(this.stripe_method_id);
    await txc.softRemove(this);
  }

  toStub(): Required<IPaymentMethodStub> {
    return {
      _id: this._id,
      last4: this.last4,
      brand: this.brand,
      created_at: this.created_at,
      is_primary: this.is_primary,
      last_used_at: this.last_used_at
    };
  }

  toFull(): Required<IPaymentMethod> {
    return {
      ...this.toStub(),
      billing_details: this.billing_details,
      stripe_method_id: this.stripe_method_id
    };
  }
}
