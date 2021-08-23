import { User, Performance } from '@core/api';
import { timestamp, uuid } from '@core/helpers';
import { ILike, LikeLocation, NUUID } from '@core/interfaces';
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
export class Like extends BaseEntity implements ILike {
  // Make composite primary key with user and performance IDs (to help ensure user can't like twice)
  @PrimaryColumn('varchar') _id: NUUID;

  @RelationId((like: Like) => like.user) user__id: NUUID;
  @ManyToOne(() => User) user: User;

  @RelationId((like: Like) => like.performance) performance__id: NUUID;
  @ManyToOne(() => Performance, performance => performance.likes) performance: Performance;

  @Column() like_date: number;
  @Column('varchar') like_location: LikeLocation;

  @DeleteDateColumn() deletedAt?: Date;

  constructor(user: User, performance: Performance, location: LikeLocation) {
    super();
    this._id = uuid();
    this.like_date = timestamp();
    this.like_location = location;
    this.user = user;
    this.performance = performance;
  }
}
