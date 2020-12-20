import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany, EntityManager } from "typeorm";
import { IHostPrivate, IHost, IHostStub, HostPermission, ISocialInfo, IAddress } from "@eventi/interfaces";
import { User } from '../Users/User.model';
import { Performance } from "../Performances/Performance.model";
import { UserHostInfo } from "./UserHostInfo.model";
import { DataClient } from "../../common/data";
import { Address } from "../Users/Address.model";
 
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

  @Column()                     mobile_number: number;
  @Column()                     landline_number: number;
  @Column()                     email_address: string;

  addresses:IAddress[];
  // @OneToMany(() => Address, address => address.owner)

  @OneToMany(() => User, user => user.host)                      members:User[];
  @OneToMany(() => Performance, performance => performance.host) performances: Performance[];

  constructor(data:Pick<IHostPrivate, "name" | "username" | "email_address">) {
    super();
    this.username = data.username;
    this.name = data.name;
    this.email_address = data.email_address;

    this.is_onboarded = false;
    this.created_at = Math.floor(Date.now() / 1000);//timestamp in seconds
    this.members = [];
  }

  async addMember(user:User, permissionLevel:HostPermission, txc:EntityManager) {
    // Create permissions link
    const userHostInfo = new UserHostInfo(user, this, permissionLevel);

    // Add user to host group
    // this.members_info.push(userHostInfo);
    this.members.push(user);

    await txc.save(userHostInfo);
    await txc.save(this);
  }

  async removeMember(user:User, txc:EntityManager) {
    // const uhi = await txc.findOne(UserHostInfo, { user: user, host: this});
    // this.members = this.members.splice(this.members.findIndex(m => m._id == user._id), 1);
    // user.host = null;

    // await Promise.all([
    //   txc.remove(uhi), txc.save(this), txc.save(user)
    // ])
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
      members: this.members?.map((u:User) => u.toStub()) || [],
      performances: this.performances?.map((p:Performance) => p.toStub()) || [],
      is_onboarded: this.is_onboarded,
      social_info: this.social_info
    };
  }

  toPrivate():IHostPrivate {
    return {
      ...this.toFull(),
      email_address: this.email_address,
      mobile_number: this.mobile_number,
      landline_number: this.landline_number,
      addresses: this.addresses
    }
  }
}

