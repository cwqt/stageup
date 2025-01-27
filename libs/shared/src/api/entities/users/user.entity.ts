import { DtoSocialLogin, IUser, IUserStub, IUserPrivate, IMyself, ILocale, ConsentOpts, ConsentOpt, LoginMethod, IPersonInfo } from '@core/interfaces';
import { uuid } from '@core/helpers';
import bcrypt from 'bcrypt';
import {
  BaseEntity,
  Entity,
  Column,
  OneToMany,
  ManyToOne,
  OneToOne,
  JoinColumn,
  EntityManager,
  BeforeInsert,
  PrimaryColumn
} from 'typeorm';
import { Except } from 'type-fest';

import { Host } from '../hosts/host.entity';
import { Person } from './person.entity';
import { ContactInfo } from './contact-info.entity';
import { PatronSubscription } from './patron-subscription.entity';
import { PaymentMethod } from '../finance/payment-method.entity';
import { Invoice } from '../finance/invoice.entity';

@Entity()
export class User extends BaseEntity implements Except<IUserPrivate, 'salt' | 'pw_hash'> {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() {
    this._id = uuid();
  }

  @Column() created_at: number;
  @Column({ nullable: true }) name: string;
  @Column({ unique: true }) username: string;
  @Column({ nullable: true }) avatar?: string;
  @Column({ nullable: true }) cover_image?: string;
  @Column({ nullable: true }) bio?: string;
  @Column() is_verified: boolean;
  @Column() is_new_user: boolean;
  @Column() is_admin: boolean;
  @Column({ default: false }) is_hiding_host_marketing_prompts: boolean;
  @Column({ unique: true }) email_address: string;
  @Column() stripe_customer_id: string; // cus_xxx
  @Column('jsonb', { default: { language: 'en', region: 'GB' } }) locale: ILocale;

  @OneToMany(() => PaymentMethod, method => method.user) payment_methods: PaymentMethod[];
  @ManyToOne(() => Host, host => host.members_info) host: Host; // In one host only
  @OneToMany(() => Invoice, invoice => invoice.user) invoices: Invoice[]; // Many purchases
  @OneToOne(() => Person, { cascade: ['remove'] }) @JoinColumn() personal_details: Person; // Lazy
  @OneToMany(() => PatronSubscription, sub => sub.user) patron_subscriptions: PatronSubscription[];

  @Column('simple-array', { default: [] }) sign_in_types: LoginMethod[];

  @Column({ nullable: true }) private salt: string;
  @Column({ nullable: true }) private pw_hash: string;

  constructor(data: {
    email_address: string;
    username: string;
    password?: string;
    stripe_customer_id: string;
    provider?: string;
  }) {
    super();
    this.username = data.username;
    this.email_address = data.email_address;
    this.stripe_customer_id = data.stripe_customer_id;
    this.created_at = Math.floor(Date.now() / 1000); // Timestamp in seconds
    this.is_admin = false;
    this.is_new_user = false; // TODO: change to true
    this.is_verified = false;
    this.is_hiding_host_marketing_prompts = false;
    // Users logging in with google/facebook/twitter etc will not have a password
    if (data.password) this.setPassword(data.password);
    // An array of sign in types (e.g. ['GOOGLE', 'FACEBOOK', 'EMAIL'])
    this.sign_in_types = [data.provider ? data.provider : 'EMAIL'];
  }

  async setup(txc: EntityManager, personalDetails?: IPersonInfo): Promise<User> {
    this.personal_details = new Person({
      first_name: personalDetails?.first_name || null,
      last_name: personalDetails?.last_name || null,
      title: personalDetails?.title || null
    });

    await this.personal_details.addContactInfo(
      new ContactInfo({
        mobile_number: null,
        landline_number: null,
        addresses: []
      }),
      txc
    );

    await txc.save(Person, this.personal_details);
    return this;
  }

  toStub(): Required<IUserStub> {
    return {
      _id: this._id,
      name: this.name,
      username: this.username,
      avatar: this.avatar
    };
  }

  toFull(): Required<IUser> {
    return {
      ...this.toStub(),
      created_at: this.created_at,
      is_new_user: this.is_new_user,
      is_verified: this.is_verified,
      is_admin: this.is_admin,
      cover_image: this.cover_image,
      bio: this.bio,
      locale: this.locale,
      is_hiding_host_marketing_prompts: this.is_hiding_host_marketing_prompts
      // Purchases: []
    };
  }

  toMyself(): Required<IMyself['user']> {
    return { ...this.toFull(), email_address: this.email_address };
  }

  toPrivate(): Required<IUserPrivate> {
    return {
      ...this.toFull(),
      pw_hash: this.pw_hash,
      salt: this.salt,
      email_address: this.email_address,
      personal_details: this.personal_details,
      stripe_customer_id: this.stripe_customer_id
    };
  }

  async verifyPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.pw_hash);
  }

  setPassword(password: string, saltRounds = 10) {
    this.salt = bcrypt.genSaltSync(saltRounds);
    this.pw_hash = bcrypt.hashSync(password, this.salt);
  }

  async update(updates: Partial<Pick<IUser, 'name' | 'bio' | 'avatar'>>): Promise<User> {
    Object.entries(updates).forEach(([k, v]: [string, any]) => {
      (this as any)[k] = v ?? (this as any)[k];
    });
    return this.save();
  }
}
