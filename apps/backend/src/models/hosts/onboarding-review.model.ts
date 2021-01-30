import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import {
  IOnboardingReview
} from '@eventi/interfaces';

import { User } from '../users/user.model';
import { timestamp } from '../../common/helpers';
import { Onboarding } from './onboarding.model';

@Entity()
export class OnboardingReview extends BaseEntity implements IOnboardingReview {
  @PrimaryGeneratedColumn() _id: number;
  @Column() onboarding_version: number;
  @Column() reviewed_at: number;
  @Column('jsonb') steps: IOnboardingReview["steps"];

  @ManyToOne(() => Onboarding, hop => hop.reviews) onboarding: Onboarding;
  @ManyToOne(() => User, { eager: true }) @JoinColumn() reviewed_by: User;

  constructor(
    onboarding: Onboarding,
    reviewer: User,
    submission: IOnboardingReview["steps"]
  ) {
    super();
    // Add relationships
    this.reviewed_by = reviewer;
    this.onboarding = onboarding;
    // Then fields
    this.steps = submission;
    this.onboarding_version = onboarding.version;
    this.reviewed_at = timestamp();
  }

  toFull(): Required<IOnboardingReview> {
    return {
      _id: this._id,
      steps: this.steps,
      onboarding_version: this.onboarding_version,
      reviewed_at: this.reviewed_at,
      reviewed_by: this.reviewed_by?.toStub(),
    };
  }
}
