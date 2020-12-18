import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany, EntityManager } from "typeorm";
import { NodeType, IHost, IHostStub, HostPermission } from "@eventi/interfaces";
import { User } from '../User.model';
import { Performance } from "../Performances/Performance.model";
import { UserHostInfo } from "./UserHostInfo.model";
import { DataClient } from "../../common/data";
 
@Entity()
export class Host extends BaseEntity implements IHost {
  @PrimaryGeneratedColumn()     _id: number;
  @Column()                     created_at: number;
  @Column()                     email_address: string;
  @Column()                     name: string;
  @Column()                     username: string;
  @Column({ nullable: true})    bio?: string;
  @Column({ nullable: true})    avatar: string;
  @Column()                     is_onboarded: boolean;


  @OneToMany(() => User, user => user.host)                      members:User[];
  @OneToMany(() => UserHostInfo, uhi => uhi.host)                members_info:UserHostInfo[];
  @OneToMany(() => Performance, performance => performance.host) performances: Performance[];

  constructor(data:Pick<IHost, "name" | "username" | "email_address">) {
    super();
    this.username = data.username;
    this.name = data.name;
    this.email_address = data.email_address;

    this.is_onboarded = false;
    this.created_at = Math.floor(Date.now() / 1000);//timestamp in seconds
    this.members = [];
    this.members_info = [];
  }

  async addMember(user:User, permissionLevel:HostPermission, txc:EntityManager) {
    // Create permissions link
    const userHostInfo = new UserHostInfo(user, this, permissionLevel);
    await txc.save(userHostInfo);

    // Add user to host group
    this.members_info.push(userHostInfo);
    this.members.push(user);
    await txc.save(this);
  }

  async removeMember(user:User, txc:EntityManager) {
    const uhi = await txc.findOne(UserHostInfo, { user: user, host: this});
    this.members = this.members.splice(this.members.findIndex(m => m._id == user._id), 1);
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
      email_address: this.email_address,
      members: this.members?.map((u:User) => u.toStub()) || [],
      members_info: this.members_info?.map((uhi:UserHostInfo) => uhi.toFull()) || [],
      performances: this.performances?.map((p:Performance) => p.toStub()) || [],
      is_onboarded: this.is_onboarded
    };
  } 

}

