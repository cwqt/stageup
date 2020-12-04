import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, OneToOne } from "typeorm";
import { NodeType, IUser, IUserStub, IUserPrivate, IPerformancePurchase } from "@eventi/interfaces";
// import { Purchase } from './Purchase.model';
import bcrypt from "bcrypt";
import { Host } from './Host.model'

@Entity()
export class User extends BaseEntity implements IUserPrivate {
  @PrimaryGeneratedColumn() _id: number;
  @Column()                 type:NodeType=NodeType.User;
  @Column()                 created_at: number;
  @Column({nullable:true})  name: string;
  @Column()                 username: string;
  @Column({nullable:true})  avatar?: string;
  @Column()                 email_address: string;
  @Column({nullable:true})  cover_image?: string;
  @Column({nullable:true})  bio?: string;
  @Column()                 is_verified: boolean;
  @Column()                 is_new_user: boolean;
  @Column()                 is_admin: boolean;
  @Column() readonly        salt: string;
  @Column() readonly        pw_hash: string;

  @ManyToOne(() => Host, host => host.members) host:Host;

  constructor(data:Pick<IUserPrivate, "username" | "email_address">, password:string) {
    super()
    this.username = data.username;
    this.email_address = data.email_address;
    this.salt = bcrypt.genSaltSync(10);
    this.pw_hash = bcrypt.hashSync(password, this.salt);
    this.created_at = Math.floor(Date.now() / 1000);//timestamp in seconds
    this.is_admin = false;
    this.is_new_user = true;
    this.is_verified = false;
  }

  toStub():IUserStub {
    let u:IUserStub = {
      name: this.name,
      _id: this._id,
      username: this.username,
      created_at: this.created_at,
      type: this.type,
      avatar: this.avatar
    };
    return u;
  }

  toFull():IUser {
    let u:IUser = {
      ...this.toStub(),
      email_address: this.email_address,
      is_new_user: this.is_new_user,
      is_verified: this.is_verified,
      is_admin: this.is_admin,
      // purchases: []
    }
    return u;
  }

  toPrivate():IUserPrivate {
    let u:IUserPrivate = {
      ...this.toFull(),
      pw_hash: this.pw_hash,
      salt: this.salt
    }
    return u;
  }

  async update(updates:Partial<Pick<IUser, "name" | "email_address" | "bio" | "avatar" | "cover_image">>):Promise<User> {
    Object.entries(updates).forEach(([k,v]:[string,any]) => {
      (<any>this)[k] = v ?? (<any>this)[k];
    })  

    return await this.save();
  }
}

