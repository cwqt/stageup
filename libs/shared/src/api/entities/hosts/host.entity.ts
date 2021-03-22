import {
  BaseEntity,
  Entity,
  Column,
  OneToMany,
  EntityManager,
  OneToOne,
  JoinColumn,
  BeforeInsert,
  PrimaryColumn
} from 'typeorm';

import { IHostPrivate, IHost, IHostStub, HostPermission, ISocialInfo, IHostBusinessDetails, HTTP, ErrCode } from '@core/interfaces';

import { User } from '../users/user.entity';
import { Performance } from '../performances/performance.entity';
import { UserHostInfo } from './user-host-info.entity';
import { Onboarding } from './onboarding.entity';
import { ContactInfo } from '../users/contact-info.entity';
import { timestamp, uuid } from '@core/shared/helpers';
import { ErrorHandler } from '../../errors';

@Entity()
export class Host extends BaseEntity implements IHostPrivate {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() { this._id = uuid() }

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

  @OneToOne(() => ContactInfo, { cascade: ['remove'] }) @JoinColumn() contact_info: ContactInfo;
  @OneToMany(() => UserHostInfo, uhi => uhi.host) members_info: UserHostInfo[];
  @OneToMany(() => Performance, performance => performance.host) performances: Performance[];
  @OneToOne(() => Onboarding, hop => hop.host) onboarding_process: Onboarding;

  constructor(data: Pick<IHostPrivate, 'name' | 'username' | 'email_address'>) {
    super();
    this.username = data.username;
    this.name = data.name;
    this.email_address = data.email_address;

    this.is_onboarded = false;
    this.created_at = timestamp();
    this.members_info = [];
    this.social_info = {
      linkedin_url: null,
      facebook_url: null,
      instagram_url: null
    };
  }

  async setup(creator: User, txc: EntityManager) {
    this.onboarding_process = await txc.save(new Onboarding(this, creator));
    this.contact_info = await txc.save(
      ContactInfo,
      new ContactInfo({
        mobile_number: null,
        landline_number: null,
        addresses: []
      })
    );

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
    if (uhi.permissions == HostPermission.Owner) throw new ErrorHandler(HTTP.Unauthorised, ErrCode.MISSING_PERMS);

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
      bio: this.bio
    };
  }

  toFull():Required<IHost> {
    return {
      ...this.toStub(),
      created_at: this.created_at,
      members_info: this.members_info?.map(uhi => uhi.toFull()) || [],
      performances: this.performances?.map((p: Performance) => p.toStub()) || [],
      is_onboarded: this.is_onboarded,
      social_info: this.social_info
    };
  }

  toPrivate():Required<IHostPrivate> {
    return {
      ...this.toFull(),
      email_address: this.email_address,
      contact_info: this.contact_info.toFull(),
      business_details: this.business_details,
      stripe_account_id: this.stripe_account_id,
    };
  } 
}