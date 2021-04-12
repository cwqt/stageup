// step 1 register host
// step 2 upload proof of business
//        - hmrc reg no
//        - billing address (stripe)
//          - active card check
// step 3 social presence
//        - website address
//        - social medias (facebook, twitter, insta, linkedin)
// step 3 integrations setup (later)
// step 4 add members (optional)
// step 5 configure subscription level
//        - free
//        - basic
//        - pro
//        - premium

import { HostSubscriptionLevel } from '../common/subscription.interface';
import { IPersonInfo } from '../users/person.interface';
import { IUser, IUserPrivate, IUserStub } from '../users/user.interface';
import { HostPermission, ISocialInfo, IHostStub, IHostBusinessDetails } from './host.interface';
import { IOnboardingStepReview } from './onboarding-step-review.interface';

export enum HostOnboardingStep {
  ProofOfBusiness = 0,
  OwnerDetails = 1,
  SocialPresence = 2
}

export enum HostOnboardingState {
  AwaitingChanges = 0, // not submitted
  PendingVerification = 1, // submit & awaiting verification from admin
  HasIssues = 2, // verified has having problems
  Verified = 3, // verified as valid
  Enacted = 4, // all stages verified & submitted as complete
  Modified = 5 // step has been modified
}

export type IHostOnboardingProcess = Omit<IHostOnboarding, 'steps'> & { steps: IOnboardingStepMap };

export interface IHostOnboarding {
  _id: string;
  state: HostOnboardingState; // when all steps verified, process is complete
  created_at: number;
  completed_at: number | null;
  last_submitted: number | null;
  last_modified: number;
  last_modified_by: IUserStub;
  last_reviewed_by?: IUserStub;
  last_reviewed?: number;
  version: number; // back and forth validation / issue handling
  // we won't store actual snapshots of onboardings, just as a link to
  // a version which an isssue was in
  host: IHostStub;
  steps: { [index in HostOnboardingStep]: HostOnboardingState };
}

export interface IOnboardingStepMap {
  [HostOnboardingStep.ProofOfBusiness]: IOnboardingStep<IOnboardingProofOfBusiness>;
  [HostOnboardingStep.OwnerDetails]: IOnboardingStep<IOnboardingOwnerDetails>;
  [HostOnboardingStep.SocialPresence]: IOnboardingStep<IOnboardingSocialPresence>;
}

export interface IOnboardingStep<T = any> {
  state:
    | HostOnboardingState.AwaitingChanges
    | HostOnboardingState.HasIssues
    | HostOnboardingState.Verified
    | HostOnboardingState.Modified;
  review?: IOnboardingStepReview<T>;
  valid: boolean; //just if all the data is filled out & correct
  data: T;
}

export type IOnboardingProofOfBusiness = IHostBusinessDetails;

export interface IOnboardingOwnerDetails {
  owner_info: IPersonInfo;
}

export interface IOnboardingSocialPresence {
  social_info: ISocialInfo;
}

/**
 * @description
 * POST member ->   value: email_address    /members
 * PUT member ->    value: HostPermission   /members/:mid -> user_id
 * DELETE member -> value: null             /members/:mid -> user_id
 */
export interface IHostMemberChangeRequest {
  value: HostPermission | IUserPrivate['email_address'] | IUser['_id'];
}

export interface IOnboardingAddMembers {
  members_to_add: IHostMemberChangeRequest[];
}

export interface IOnboardingSubscriptionConfiguration {
  tier: HostSubscriptionLevel;
}
