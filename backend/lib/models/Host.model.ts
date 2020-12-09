import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany, EntityManager } from "typeorm";
import { NodeType, IHost, IHostStub, HostPermission } from "@eventi/interfaces";
import { User } from './User.model';
import { Performance } from "./Performance.model";
import { UserHostInfo } from "./UserHostInfo.model";
import { DataClient } from "../common/data";
 
@Entity()
export class Host extends BaseEntity implements IHost {
  @PrimaryGeneratedColumn()     _id: number;
  @Column()                     created_at: number;
  @Column()                     type: NodeType=NodeType.Host;
  @Column()                     name: string;
  @Column()                     username: string;
  @Column({ nullable: true})    bio?: string;
  @Column({ nullable: true})    avatar: string;

  @OneToMany(() => User, user => user.host, { eager: true })     members:User[];
  @OneToMany(() => UserHostInfo, uhi => uhi.host)                members_info:UserHostInfo[];
  @OneToMany(() => Performance, performance => performance.host) performances: Performance[];

  constructor(data:Pick<IHost, "name" | "username">) {
    super();
    this.created_at = Math.floor(Date.now() / 1000);//timestamp in seconds
    this.username = data.username;
    this.name = data.name;
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

  toStub():IHostStub {
    return {
      _id: this._id,
      name: this.name,
      username: this.username,
      type: this.type,
      created_at: this.created_at
    };
  }

  toFull():IHost {
    return {
      ...this.toStub(),
      members: this.members?.map((u:User) => u.toStub()) || [],
      members_info: this.members_info?.map((uhi:UserHostInfo) => uhi.toFull()) || [],
      performances: this.performances?.map((p:Performance) => p.toStub()) || []
    };
  } 

}

