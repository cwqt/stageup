import { IUserStub } from '../Users/User.model';
import { HostOnboardingState, HostOnboardingStep, IHostOnboarding } from './HostOnboarding.model';
import { DottedPaths } from '../Common/FP';

/**
 * @description What the Admin sends to the /review route which is formed into an IOnboardingStepReview
 * @example
 * let review:IOnboardingStepReviewSubmission<IOnboardingOwnerDetails> = {
 *   step_state: HostOnboardingState.HasIssues,
 *   review_message: "not great",
 *   issues: {
 *     ["owner_info.title"]:{ message: "ya dun goofed" },
 *     ["owner_info.last_name"]:{ message: "not valid" }
 *   }
 * }
 */
export interface IOnboardingStepReviewSubmission<T> {
  step_state: HostOnboardingState.HasIssues | HostOnboardingState.Verified;
  issues: {[index in DottedPaths<T>]?:IOnboardingIssue}
  review_message?: string; // hand-written message
}

export interface IOnboardingIssue {
  message: string;
}

// what the database stores
// step state merged into onboarding step status hence the omit
export interface IOnboardingStepReview extends Omit<IOnboardingStepReviewSubmission<any>, 'step_state'> {
  _id: number;
  onboarding_step: HostOnboardingStep;
  onboarding_version?: IHostOnboarding["version"];
  reviewed_by: IUserStub;
  reviewed_at: number; // unix timestamp
}
