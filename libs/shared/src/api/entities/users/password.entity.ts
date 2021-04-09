import { BaseEntity, BeforeInsert, Column, Entity, EntityManager, JoinColumn, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { IPasswordReset } from '@core/interfaces';
import { uuid } from '@core/shared/helpers';
import { User } from './user.entity';

@Entity()
export class PasswordReset extends BaseEntity implements IPasswordReset {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() { this._id = uuid() }

  @Column() otp: string;
  @Column() email_address: string;
  @Column() user__id: string;
  
  @OneToMany(() => User, user => user._id ) user: User;
  
  constructor(data: Required<IPasswordReset>) {
    super();
    this.otp = data.otp;
    this.email_address = data.email_address;
    this.user__id = data.user__id;
  }  

  toReset(): Required<IPasswordReset> {
    return {
      otp: this.otp,
      email_address: this.email_address,
      user__id: this.user._id
    }
  }
}