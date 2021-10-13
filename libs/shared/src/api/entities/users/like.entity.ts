import { User, Performance, Host } from '@core/api';
import { timestamp, uuid } from '@core/helpers';
import { LikeLocation, NUUID } from '@core/interfaces';
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn,
  JoinColumn,
  RelationId,
  DeleteDateColumn
} from 'typeorm';

@Entity()
export class Like extends BaseEntity {
  // Make composite primary key with user and performance IDs (to help ensure user can't like twice)
  @PrimaryColumn('varchar') _id: NUUID;

  @RelationId((like: Like) => like.user) user__id: NUUID;
  @ManyToOne(() => User) user: User;

  @RelationId((like: Like) => like.performance) performance__id: NUUID;
  @ManyToOne(() => Performance, performance => performance.likes) performance: Performance;

  @RelationId((like: Like) => like.host) host__id: NUUID;
  @ManyToOne(() => Host, host => host.likes) host: Host;

  @Column() like_date: number;
  @Column('varchar') like_location: LikeLocation;

  @DeleteDateColumn() deletedAt?: Date;

  constructor(user: User, location: LikeLocation, target: Performance | Host) {
    super();
    this._id = uuid();
    this.like_date = timestamp();
    this.like_location = location;
    this.user = user;
    target instanceof Performance ? (this.performance = target) : (this.host = target);
  }
}
