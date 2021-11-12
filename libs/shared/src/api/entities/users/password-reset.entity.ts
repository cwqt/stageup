import {
  BaseEntity,
  BeforeInsert,
  Column,
  Entity,
  EntityManager,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn
} from 'typeorm';
import { uuid } from '@core/helpers';
import { User } from './user.entity';
import { IPasswordReset } from '@core/interfaces';

@Entity()
export class PasswordReset extends BaseEntity implements IPasswordReset {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() {
    this._id = uuid();
  }

  @Column() otp: string;
  @Column() email_address: string;
  @ManyToOne(() => User, user => user._id, {onDelete: 'CASCADE'}) user: User;

  constructor(data: Required<IPasswordReset>) {
    super();
    this.otp = data.otp;
    this.email_address = data.email_address;
    this.user = data.user;
  }
}
