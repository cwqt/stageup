import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { HostPermission, IUserHostInfo } from '@eventi/interfaces';

import { Host } from './host.model';
import { User } from '../users/user.model';
import { unixTimestamp } from '../../common/helpers';

@Entity()
export class UserHostInfo extends BaseEntity implements IUserHostInfo {
  @PrimaryGeneratedColumn() _id: number;
  @Column() joined_at: number;
  @Column() permissions: HostPermission;

  @OneToOne(() => User) @JoinColumn() user: User;
  @ManyToOne(() => Host, host => host.members_info) host: Host;

  constructor(user: User, host: Host, permissions: HostPermission) {
    super();
    user.host = host;

    this.user = user;
    this.host = host;
    this.joined_at = unixTimestamp();
    this.permissions = permissions;
  }

  toFull(): IUserHostInfo {
    return {
      joined_at: this.joined_at,
      permissions: this.permissions
    };
  }
}
