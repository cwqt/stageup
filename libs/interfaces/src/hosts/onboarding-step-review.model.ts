import { IUserStub } from '../users/user.model';
import { HostOnboardingState, HostOnboardingStep, IHostOnboarding } from './host-onboarding.model';
import { DottedPaths } from '../common/fp';

/**
 * @description What the Admin sends to the /review route which is formed into an IOnboardingStepReview
 * @example
 * let review:IOnboardingStepReviewSubmission<IOnboardingOwnerDetails> = {
 *   step_state: HostOnboardingState.HasIssues,
 *   review_message: "not great",
 *   issues: {
 *     ["owner_info.title"]:["Not a valid title"],
 *     ["owner_info.last_name"]:["Please use full last name", "Name does not match HMRC company listing"]
 *   }
 * }
 */
export interface IOnboardingStepReviewSubmission<T> {
  step_state: HostOnboardingState.HasIssues | HostOnboardingState.Verified;
  issues: {[index in DottedPaths<T>]?:string[]}
  review_message?: string; // hand-written message
}

export interface IOnboardingReview {
  _id: number;
  onboarding_version?: IHostOnboarding["version"];
  reviewed_by: IUserStub;
  reviewed_at: number; // unix timestamp
  steps: {[ index in HostOnboardingStep]: IOnboardingStepReviewSubmission<any>}
};