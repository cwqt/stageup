import { NodeType, IUser, IUserStub, IUserPrivate, DataModel } from "@eventi/interfaces";
import { IoTJobsDataPlane } from "aws-sdk";
import bcrypt from "bcrypt";

import {BaseEntity, Entity, PrimaryGeneratedColumn, Column, CreateDateColumn} from "typeorm";
 
@Entity()
export class User extends BaseEntity implements IUserPrivate {
  @PrimaryGeneratedColumn()
  _id: string;

  @Column()
  type:NodeType=NodeType.User;

  @Column()
  created_at: number;

  @Column({nullable:true})
  name: string;
  
  @Column()
  username: string;
  
  @Column({nullable:true})
  avatar?: string;
  
  @Column()
  email_address: string;
  
  @Column({nullable:true})
  cover_image?: string;
  
  @Column({nullable:true})
  bio?: string;
  
  @Column()
  is_verified: boolean;
  
  @Column()
  is_new_user: boolean;
  
  @Column()
  is_admin: boolean;
  
  @Column()
  readonly salt: string;
  
  @Column()
  readonly pw_hash: string;

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
      type: this.type
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

  update(updates:Partial<Pick<IUser, "name">>):IUser {
    return this;
  }
}

