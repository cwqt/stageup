import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import {
  IOnboardingStepReviewSubmission,
  HostOnboardingState,
  HostOnboardingStep,
  IOnboardingReview
} from '@eventi/interfaces';

import { User } from '../users/user.model';
import { timestamp } from '../../common/helpers';
import { Onboarding } from './onboarding.model';

@Entity()
export class OnboardingReview extends BaseEntity implements IOnboardingReview {
  @PrimaryGeneratedColumn() _id: number;
  @Column() onboarding_version: number;
  @Column() review_message: string;
  @Column() reviewed_at: number;
  @Column('enum', { enum: HostOnboardingStep }) onboarding_step: HostOnboardingStep;
  @Column('enum', { enum: [HostOnboardingState.Verified, HostOnboardingState.HasIssues] }) step_state: HostOnboardingState.Verified | HostOnboardingState.HasIssues;
  @Column('jsonb') steps: {[ index in HostOnboardingStep]: IOnboardingStepReviewSubmission<any>};

  @ManyToOne(() => Onboarding, hop => hop.reviews) onboarding: Onboarding;
  @ManyToOne(() => User, { eager: true }) @JoinColumn() reviewed_by: User;

  constructor(
    step: HostOnboardingStep,
    onboarding: Onboarding,
    reviewer: User,
    submission: IOnboardingStepReviewSubmission<unknown>
  ) {
    super();
    // Add relationships
    this.reviewed_by = reviewer;
    this.onboarding_step = step;
    this.onboarding = onboarding;
    // Then fields
    this.review_message = submission.review_message ?? '';
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
