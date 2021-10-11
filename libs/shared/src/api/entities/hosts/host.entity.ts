import {
  BaseEntity,
  Entity,
  Column,
  OneToMany,
  EntityManager,
  OneToOne,
  JoinColumn,
  BeforeInsert,
  PrimaryColumn,
  Check
} from 'typeorm';

import {
  IHostPrivate,
  IHost,
  IHostStub,
  HostPermission,
  ISocialInfo,
  IHostBusinessDetails,
  HTTP,
  IDeleteHostReason,
  ILocale
} from '@core/interfaces';

import { AssetGroup } from './../assets/asset-group.entity';
import { User } from '../users/user.entity';
import { Performance } from '../performances/performance.entity';
import { UserHostInfo } from './user-host-info.entity';
import { Onboarding } from './onboarding.entity';
import { timestamp, uuid } from '@core/helpers';
import { ErrorHandler } from '../../errors';
import { Invoice } from '../finance/invoice.entity';
import { PatronTier } from './patron-tier.entity';
import { PatronSubscription } from '@core/api';

@Entity()
@Check('0 <= "commission_rate" AND commission_rate <= 1') // Commission rate is a percentage
export class Host extends BaseEntity implements IHostPrivate {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() {
    this._id = uuid();
  }

  @Column() created_at: number;
  @Column() name: string;
  @Column() username: string;
  @Column({ nullable: true }) bio?: string;
  @Column({ nullable: true }) avatar: string;
  @Column({ nullable: true }) banner: string;
  @Column() is_onboarded: boolean;
  @Column() email_address: string;
  @Column({ nullable: true }) stripe_account_id: string;
  @Column('jsonb') social_info: ISocialInfo;
  @Column('jsonb', { nullable: true }) business_details: IHostBusinessDetails;
  @Column('jsonb', { default: { language: 'en', region: 'GB' } }) locale: ILocale;
  @Column('jsonb', { nullable: true }) delete_reason?: IDeleteHostReason;

  @OneToMany(() => Invoice, invoice => invoice.host) invoices: Invoice[];
  @OneToMany(() => PatronTier, tier => tier.host, { cascade: ['soft-remove'] }) patron_tiers: PatronTier[];
  @OneToMany(() => PatronSubscription, sub => sub.host) patron_subscribers: PatronSubscription[];
  @OneToMany(() => UserHostInfo, uhi => uhi.host) members_info: UserHostInfo[];
  @OneToMany(() => Performance, perf => perf.host, { cascade: ['soft-remove'] }) performances: Performance[];

  @OneToOne(() => User) @JoinColumn() owner: User;
  @OneToOne(() => Onboarding, hop => hop.host) onboarding_process: Onboarding;
  @Column({ nullable: true, type: 'float' }) commission_rate: number;

  @OneToOne(() => AssetGroup, { eager: true, onDelete: 'CASCADE', cascade: true })
  @JoinColumn()
  asset_group: AssetGroup;

  constructor(data: Pick<IHostPrivate, 'name' | 'username' | 'email_address'>) {
    super();
    this.username = data.username;
    this.name = data.name;
    this.email_address = data.email_address;

    this.is_onboarded = false;
    this.created_at = timestamp();
    this.members_info = [];
    this.patron_tiers = [];
    this.social_info = {
      site_url: null,
      linkedin_url: null,
      facebook_url: null,
      instagram_url: null,
      twitter_url: null,
      pinterest_url: null,
      youtube_url: null
    };
    this.commission_rate = null;
  }

  async setup(creator: User, txc: EntityManager) {
    this.owner = creator;
    this.onboarding_process = await txc.save(new Onboarding(this, creator));

    const group = new AssetGroup(this._id);
    await txc.save(group);
    this.asset_group = group;
    await txc.save(this);

    return this;
  }

  async addMember(user: User, permissionLevel: HostPermission, txc: EntityManager) {
    // Create permissions link
    const userHostInfo = new UserHostInfo(user, this, permissionLevel);
    await txc.save(userHostInfo);
    await Promise.all([txc.save(userHostInfo), txc.save(user)]);

    // Add user to host group
    this.members_info.push(userHostInfo);
  }

  async removeMember(user: User, txc: EntityManager) {
    const uhi = await txc.findOne(UserHostInfo, { user: user, host: this });

    // Can't remove an Owner
    if (uhi.permissions == HostPermission.Owner)
      throw new ErrorHandler(HTTP.Unauthorised, '@@error.missing_permissions');

    this.members_info = this.members_info.splice(
      this.members_info.findIndex(m => m._id === user._id),
      1
    );
    user.host = null;

    await Promise.all([txc.remove(uhi), txc.save(this), txc.save(user)]);
  }

  toStub(): Required<IHostStub> {
    return {
      _id: this._id,
      name: this.name,
      username: this.username,
      avatar: this.avatar,
      banner: this.banner,
      bio: this.bio,
      stripe_account_id: this.stripe_account_id,
      assets: this.asset_group?.assets.map(a => a.toStub())
    };
  }

  toFull(): Required<IHost> {
    return {
      ...this.toStub(),
      created_at: this.created_at,
      is_onboarded: this.is_onboarded,
      social_info: this.social_info,
      commission_rate: this.commission_rate
    };
  }

  toPrivate(): Required<IHostPrivate> {
    return {
      ...this.toFull(),
      email_address: this.email_address,
      business_details: this.business_details,
      social_info: this.social_info
    };
  }
}
