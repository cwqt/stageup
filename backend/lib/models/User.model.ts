import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, OneToOne, JoinColumn, ManyToMany } from "typeorm";
import { NodeType, IUser, IUserStub, IUserPrivate, IPerformancePurchase } from "@eventi/interfaces";
// import { Purchase } from './Purchase.model';
import bcrypt from "bcrypt";
import { Host } from './Host.model'
import { Purchase } from "./Purchase.model";
import { Performance } from "./Performance.model";
import config from '../config';

@Entity()
export class User extends BaseEntity implements Omit<IUserPrivate, "salt" | "pw_hash"> {
  @PrimaryGeneratedColumn() _id: number;
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
  @Column() private         salt: string;
  @Column() private         pw_hash: string;

  @ManyToOne(() => Host, host => host.members)                      host:Host; //in one host only
  @OneToMany(() => Purchase, purchase => purchase.user)             purchases:Purchase[];//many purchases
  @OneToMany(() => Performance, performance => performance.creator) performances: Performance[];

  constructor(data:Pick<IUserPrivate, "username" | "email_address"> & { password: string }) {
    super()
    this.username = data.username;
    this.email_address = data.email_address;
    this.created_at = Math.floor(Date.now() / 1000);//timestamp in seconds
    this.is_admin = false;
    this.is_new_user = true;
    this.is_verified = config.PRODUCTION ? false : true;//auto-verify when not in prod
    this.setPassword(data.password);
  }

  toStub():Required<IUserStub> {
    return {
      _id: this._id,
      name: this.name,
      username: this.username,
      avatar: this.avatar
    };
  }

  toFull():Required<IUser> {
    return {
      ...this.toStub(),
      created_at: this.created_at,
      email_address: this.email_address,
      is_new_user: this.is_new_user,
      is_verified: this.is_verified,
      is_admin: this.is_admin,
      cover_image: this.cover_image,
      bio: this.bio
      // purchases: []
    };
  }

  toPrivate():Required<IUserPrivate> {
    return {
      ...this.toFull(),
      pw_hash: this.pw_hash,
      salt: this.salt
    }
  }

  async verifyPassword(password:string):Promise<boolean> {
    return await bcrypt.compare(password, this.pw_hash);
  }

  setPassword(password:string, saltRounds:number=10) {
    this.salt = bcrypt.genSaltSync(saltRounds);
    this.pw_hash = bcrypt.hashSync(password, this.salt);
  }

  async update(updates:Partial<Pick<IUser, "name" | "email_address" | "bio" | "avatar" | "cover_image">>):Promise<User> {
    Object.entries(updates).forEach(([k,v]:[string,any]) => {
      (<any>this)[k] = v ?? (<any>this)[k];
    })  

    return await this.save();
  }
}

