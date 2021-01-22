import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';

import {
  IOnboardingStepReviewSubmission,
  HostOnboardingState,
  HostOnboardingStep,
  IOnboardingIssue,
  IOnboardingStepReview
} from '@eventi/interfaces';

import { User } from '../users/user.model';
import { unixTimestamp } from '../../common/helpers';
import { HostOnboardingProcess } from './onboarding.model';

@Entity()
export class OnboardingStepReview extends BaseEntity implements IOnboardingStepReview {
  @PrimaryGeneratedColumn() _id: number;
  @Column() onboarding_step: HostOnboardingStep;
  @Column() onboarding_version: number;
  @Column() step_state: HostOnboardingState.Verified | HostOnboardingState.HasIssues;
  @Column({ type: 'jsonb' }) issues: IOnboardingIssue<any>[];
  @Column() review_message: string;
  @Column() reviewed_at: number;

  @ManyToOne(() => HostOnboardingProcess, hop => hop.reviews) onboarding: HostOnboardingProcess;
  @ManyToOne(() => User) @JoinColumn() reviewed_by: User;

  constructor(
    step: HostOnboardingStep,
    onboarding: HostOnboardingProcess,
    reviewer: User,
    submission: IOnboardingStepReviewSubmission<any>
  ) {
    super();
    // Add relationships
    this.reviewed_by = reviewer;
    this.onboarding_step = step;
    this.onboarding = onboarding;
    // Then fields
    this.step_state = submission.step_state;
    this.issues = submission.issues;
    this.review_message = submission.review_message ?? '';
    this.onboarding_version = onboarding.version;
    this.reviewed_at = unixTimestamp();
  }

  toFull(): Required<IOnboardingStepReview> {
    return {
      _id: this._id,
      onboarding_step: this.onboarding_step,
      onboarding_version: this.onboarding_version,
      issues: this.issues,
      reviewed_at: this.reviewed_at,
      reviewed_by: this.reviewed_by?.toStub(),
      review_message: this.review_message
    };
  }
}
