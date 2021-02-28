import { BaseEntity, BeforeInsert, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { HostInviteState, IHostInvitation } from '@core/interfaces';

import { Host } from './host.entity';
import { User } from '../users/user.entity';
import { timestamp, uuid } from '@core/shared/helpers';

@Entity()
export class HostInvitation extends BaseEntity implements IHostInvitation {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() { this._id = uuid() }

  @Column() created_at: number;
  @Column() expires_at: number;
  @Column('enum', {
    enum: HostInviteState,
    default: HostInviteState.Pending
  }) state: HostInviteState;

  @ManyToOne(() => User) @JoinColumn() inviter: User;
  @ManyToOne(() => User) @JoinColumn() invitee: User;
  @ManyToOne(() => Host) @JoinColumn() host: Host;
  
  constructor(inviter: User, invitee:User, host: Host) {
    super();

    this.inviter = inviter;
    this.invitee = invitee;
    this.host = host;

    this.state = HostInviteState.Pending;
    this.created_at = timestamp();
    this.expires_at = timestamp() + 864000; // expire in 1 day
  }

  toFull(): Required<IHostInvitation> {
    return {
      _id: this._id,
      expires_at: this.expires_at,
      created_at: this.created_at,
      state: this.state,
      inviter: this.inviter.toStub(),
      invitee: this.invitee.toStub(),
      host: this.host.toStub()
    };
  }
}
