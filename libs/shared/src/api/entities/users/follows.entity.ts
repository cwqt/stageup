import { Host, User } from '@core/api';
import { timestamp, uuid } from '@core/helpers';
import { NUUID, IFollow, IFollowing, IFollower } from '@core/interfaces';
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn, RelationId } from 'typeorm';

@Entity()
export class Follow extends BaseEntity implements IFollow {
  @PrimaryColumn('varchar') _id: NUUID;
  @Column() follow_date: number;

  // Many-to-Many relation
  @RelationId((follow: Follow) => follow.user) user__id: NUUID;
  @ManyToOne(() => User) user: User;

  @RelationId((follow: Follow) => follow.host) host__id: NUUID;
  @ManyToOne(() => Host) host: Host;
 
  constructor(user: User, host: Host) {
    super();
    this._id = uuid();
    this.follow_date = timestamp();
    this.user = user;
    this.host = host;
  }

  // Methods for returning the follows depending on the perspective of the host or user
  toFollowing(): Required<IFollowing> {
    return {
      _id: this._id,
      follow_date: this.follow_date,
      host__id: this.host__id,
    };
  }

  toFollower(): Required<IFollower> {
    return {
      _id: this._id,
      follow_date: this.follow_date,
      user__id: this.user__id,
    };
  }
}
