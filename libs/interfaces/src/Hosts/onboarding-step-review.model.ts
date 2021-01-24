import { IUserStub } from '../users/user.model';
import { HostOnboardingState, HostOnboardingStep } from './host-onboarding.model';

export interface IOnboardingIssue<T> {
  param: keyof T;
  message: string;
}

// what we send to the backend from the client
export interface IOnboardingStepReviewSubmission<T> {
  step_state: HostOnboardingState.HasIssues | HostOnboardingState.Verified;
  issues: IOnboardingIssue<T>[];
  review_message?: string; // hand-written message
}

// what the database stores
// step state merged into onboarding step status hence the omit
export interface IOnboardingStepReview extends Omit<IOnboardingStepReviewSubmission<any>, 'step_state'> {
  _id: number;
  onboarding_step: HostOnboardingStep;
  onboarding_version?: number; //which onboarding version this issue relates to
  reviewed_by: IUserStub;
  reviewed_at: number; // unix timestamp
}
