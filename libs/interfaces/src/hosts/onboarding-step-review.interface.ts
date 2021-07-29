import { DottedPaths } from '../common/fp.interface';
import { IUserStub } from '../users/user.interface';
import { HostOnboardingState, HostOnboardingStep, IHostOnboarding } from './host-onboarding.interface';

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
export interface IOnboardingStepReview<T> {
  state: HostOnboardingState.HasIssues | HostOnboardingState.Verified;
  issues: { [index in DottedPaths<T>]?: string[] };
  review_message?: string; // hand-written message
}

export interface IOnboardingReview {
  _id: string;
  onboarding_version?: IHostOnboarding['version'];
  reviewed_by: IUserStub;
  reviewed_at: number; // unix timestamp
  steps: { [index in HostOnboardingStep]?: IOnboardingStepReview<any> };
}
