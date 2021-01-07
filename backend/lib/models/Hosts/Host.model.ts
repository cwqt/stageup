import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany, EntityManager, OneToOne, JoinColumn } from "typeorm";
import { IHostPrivate, IHost, IHostStub, HostPermission, ISocialInfo, IHostBusinessDetails } from "@eventi/interfaces";
import { User } from '../Users/User.model';
import { Performance } from "../Performances/Performance.model";
import { UserHostInfo } from "./UserHostInfo.model";
import { HostOnboardingProcess } from "./Onboarding.model";
import { ContactInfo } from "../Users/ContactInfo.model";
import { unixTimestamp } from "../../common/helpers";
 
@Entity()
export class Host extends BaseEntity implements IHostPrivate {
  @PrimaryGeneratedColumn()     _id: number;
  @Column()                     created_at: number;
  @Column()                     name: string;
  @Column()                     username: string;
  @Column({ nullable: true})    bio?: string;
  @Column({ nullable: true})    avatar: string;
  @Column()                     is_onboarded: boolean;
  @Column("jsonb")              social_info: ISocialInfo;
  @Column("jsonb",
    { nullable:true })          business_details: IHostBusinessDetails;
  @Column()                     email_address: string;

  @OneToOne(() => ContactInfo, { cascade: ["remove"]}) @JoinColumn() contact_info:ContactInfo;
  @OneToMany(() => UserHostInfo, uhi => uhi.host)                    members_info:UserHostInfo[];
  @OneToMany(() => Performance, performance => performance.host)     performances: Performance[];
  @OneToOne(() => HostOnboardingProcess, hop => hop.host)            onboarding_process:HostOnboardingProcess;

  constructor(data:Pick<IHostPrivate, "name" | "username" | "email_address">) {
    super();
    this.username = data.username;
    this.name = data.name;
    this.email_address = data.email_address;

    this.is_onboarded = false;
    this.created_at = unixTimestamp(new Date());
    this.members_info = [];
    this.social_info = {
      linkedin_url: null,
      facebook_url: null,
      instagram_url: null
    }
  }
  
  /**
   * @description Creates onboarding process
   */
  async setup(creator:User, txc:EntityManager) {
    this.onboarding_process = await txc.save(new HostOnboardingProcess(this, creator));
    this.contact_info = await txc.save(ContactInfo, new ContactInfo({
      mobile_number: null,
      landline_number: null,
      addresses: []
    }));

    return this;
  }

  async addMember(user:User, permissionLevel:HostPermission, txc:EntityManager) {
    // Create permissions link
    const userHostInfo = new UserHostInfo(user, this, permissionLevel);
    await txc.save(userHostInfo);

    // Add user to host group
    this.members_info.push(userHostInfo);
  }

  async removeMember(user:User, txc:EntityManager) {
    const uhi = await txc.findOne(UserHostInfo, { user: user, host: this});
    this.members_info = this.members_info.splice(this.members_info.findIndex(m => m._id == user._id), 1);
    user.host = null;

    await Promise.all([
      txc.remove(uhi), txc.save(this), txc.save(user)
    ])
  }

  toStub():IHostStub {
    return {
      _id: this._id,
      name: this.name,
      username: this.username,
    };
  }

  toFull():IHost {
    return {
      ...this.toStub(),
      created_at: this.created_at,
      members_info: this.members_info?.map(uhi => uhi.toFull()) || [],
      performances: this.performances?.map((p:Performance) => p.toStub()) || [],
      is_onboarded: this.is_onboarded,
      social_info: this.social_info
    };
  }

  toPrivate():IHostPrivate {
    return {
      ...this.toFull(),
      email_address: this.email_address,
      contact_info: this.contact_info.toFull(),
      business_details: this.business_details
    }
  }
}

