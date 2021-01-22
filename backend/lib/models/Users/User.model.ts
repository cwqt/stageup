import bcrypt from 'bcrypt';
import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  OneToOne,
  JoinColumn,
  EntityManager
} from 'typeorm';
import { Except } from 'type-fest';
import { IUser, IUserStub, IUserPrivate } from '@eventi/interfaces';

import { Host } from '../hosts/host.model';
import { Purchase } from '../purchase.model';
import { Performance } from '../performances/performance.model';
import { Person } from './person.model';
import { ContactInfo } from './contact-info.model';
import config from '../../config';

@Entity()
export class User extends BaseEntity implements Except<IUserPrivate, 'salt' | 'pw_hash'> {
  @PrimaryGeneratedColumn() _id: number;
  @Column() created_at: number;
  @Column({ nullable: true }) name: string;
  @Column() username: string;
  @Column({ nullable: true }) avatar?: string;
  @Column({ nullable: true }) cover_image?: string;
  @Column({ nullable: true }) bio?: string;
  @Column() is_verified: boolean;
  @Column() is_new_user: boolean;
  @Column() is_admin: boolean;
  @Column() email_address: string;
  @Column() private salt: string;
  @Column() private pw_hash: string;

  @ManyToOne(() => Host, host => host.members_info) host: Host; // In one host only
  @OneToMany(() => Purchase, purchase => purchase.user) purchases: Purchase[]; // Many purchases
  @OneToMany(() => Performance, performance => performance.creator) performances: Performance[];
  @OneToOne(() => Person, { cascade: ['remove'] }) @JoinColumn() personal_details: Person; // Lazy

  constructor(data: { email_address: string; username: string; password: string }) {
    super();
    this.username = data.username;
    this.email_address = data.email_address;
    this.created_at = Math.floor(Date.now() / 1000); // Timestamp in seconds
    this.is_admin = false;
    this.is_new_user = false; // TODO: change to true
    this.is_verified = !config.PRODUCTION; // Auto-verify when not in prod
    this.setPassword(data.password);
  }

  async setup(txc: EntityManager): Promise<User> {
    this.personal_details = new Person({
      first_name: null,
      last_name: null,
      title: null
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
      bio: this.bio
      // Purchases: []
    };
  }

  toPrivate(): Required<IUserPrivate> {
    return {
      ...this.toFull(),
      pw_hash: this.pw_hash,
      salt: this.salt,
      email_address: this.email_address,
      personal_details: this.personal_details
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
      (<any>this)[k] = v ?? (<any>this)[k];
    });

    return await this.save();
  }
}
