import { BaseEntity, BeforeInsert, Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { HostPermission, IUserHostInfo } from '@core/interfaces';

import { Host } from './host.model';
import { User } from '../users/user.model';
import { timestamp, uuid } from '@core/shared/helpers';

@Entity()
export class UserHostInfo extends BaseEntity implements IUserHostInfo {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() { this._id = uuid() }

  @Column() joined_at: number;
  @Column('enum', { enum: HostPermission }) permissions: HostPermission;

  @OneToOne(() => User) @JoinColumn() user: User;
  @ManyToOne(() => Host, host => host.members_info) host: Host;

  constructor(user: User, host: Host, permissions: HostPermission) {
    super();
    this.joined_at = timestamp();
    this.permissions = permissions;

    user.host = host; // Add relationship
    this.user = user;
    this.host = host;
  }

  
  toFull(): Required<IUserHostInfo> {
    return {
      joined_at: this.joined_at,
      permissions: this.permissions,
      user: this.user.toStub()
    };
  }
}
