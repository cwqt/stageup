import {
  BaseEntity,
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn
} from 'typeorm';

import { IOnboardingReview } from '@core/interfaces';

import { User } from '../users/user.entity';
import { timestamp, uuid } from '@core/helpers';
import { Onboarding } from './onboarding.entity';

@Entity()
export class OnboardingReview extends BaseEntity implements IOnboardingReview {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() {
    this._id = uuid();
  }

  @Column() onboarding_version: number;
  @Column() reviewed_at: number;
  @Column('jsonb') steps: IOnboardingReview['steps'];

  @ManyToOne(() => Onboarding, hop => hop.reviews) onboarding: Onboarding;
  @ManyToOne(() => User, { eager: true }) @JoinColumn() reviewed_by: User;

  constructor(onboarding: Onboarding, reviewer: User, submission: IOnboardingReview['steps']) {
    super();
    // Add relationships
    this.reviewed_by = reviewer;
    this.onboarding = onboarding;
    this.steps = submission;
    this.onboarding_version = onboarding.version;
    // Then fields
    this.reviewed_at = timestamp();
  }

  toFull(): Required<IOnboardingReview> {
    return {
      _id: this._id,
      steps: this.steps,
      onboarding_version: this.onboarding_version,
      reviewed_at: this.reviewed_at,
      reviewed_by: this.reviewed_by?.toStub()
    };
  }
}
