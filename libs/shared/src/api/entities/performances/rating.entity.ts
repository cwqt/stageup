import { Performance, User } from '@core/api';
import { timestamp, uuid } from '@core/helpers';
import { NUUID, IRating } from '@core/interfaces';
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn, RelationId, Unique } from 'typeorm';

@Entity()
@Unique(['user', 'performance'])
export class Rating extends BaseEntity implements IRating {
  @PrimaryColumn('varchar') _id: NUUID;
  @Column() created_at: number;
  @Column('float') rating: number;

  // Many-to-Many relation
  @RelationId((rating: Rating) => rating.user) user__id: NUUID;
  @ManyToOne(() => User) user: User;

  @RelationId((rating: Rating) => rating.performance) performance__id: NUUID;
  @ManyToOne(() => Performance) performance: Performance;

  constructor(user: User, performance: Performance, rating: number) {
    super();
    this._id = uuid();
    this.created_at = timestamp();
    this.user = user;
    this.rating = rating;
    this.performance = performance;
  }
}
