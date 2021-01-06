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

import { HostSubscriptionLevel } from '../Common/Subscription.model';
import { IAddress, IPersonInfo } from '../Users/Person.model';
import { IUserStub } from '../Users/User.model';
import { HostPermission, ISocialInfo } from './Host.model';

export enum HostOnboardingStep {
  ProofOfBusiness,
  OwnerDetails,
  SocialPresence,
  AddMembers,
  SubscriptionConfiguration,
}

export enum HostOnboardingState {
  AwaitingChanges, // not submitted
  PendingVerification, // submit & awaiting verification from admin
  HasIssues, // verified has having problems
  Verified, // verified as valud
  Enacted, // all stages verified & submitted as complete
}

export type IHostOnboardingProcess = IHostOnboarding & { steps: IOnboardingStepMap };

export interface IHostOnboarding {
  _id: number;
  status: HostOnboardingState; // when all steps verified, process is complete
  created_at: number;
  completed_at: number | null;
  last_submitted: number | null;
  last_modified: number;
  last_modified_by: IUserStub;
  version: number; // back and forth validation / issue handling
  // we won't store actual snapshots of onboardings, just as a link to
  // a version which an issue was in
}

export interface IOnboardingStepMap {
  [HostOnboardingStep.ProofOfBusiness]: IOnboardingStep<IOnboardingProofOfBusiness>;
  [HostOnboardingStep.OwnerDetails]: IOnboardingStep<IOnboardingOwnerDetails>;
  [HostOnboardingStep.SocialPresence]: IOnboardingStep<IOnboardingSocialPresence>;
  [HostOnboardingStep.AddMembers]: IOnboardingStep<IOnboardingAddMembers>;
  [HostOnboardingStep.SubscriptionConfiguration]: IOnboardingStep<IOnboardingSubscriptionConfiguration>;
}

export interface IOnboardingStep<T> {
  status: HostOnboardingState.AwaitingChanges | HostOnboardingState.HasIssues | HostOnboardingState.Verified;
  issues: IOnboardingIssue[];
  valid: boolean; //just if all the data is filled out & correct
  data: T;
}

export interface IOnboardingIssue {
  param: string;
  message: string;
  version?: number; //which onboarding version this issue relates to
}

export interface IOnboardingProofOfBusiness {
  hmrc_company_number: number;
  business_contact_number: number;
  business_address: IAddress;
}

export interface IOnboardingOwnerDetails {
  owner_info: IPersonInfo;
}

export interface IOnboardingSocialPresence {
  social_info: ISocialInfo;
}

export interface IHostMemberChangeRequest {
  user_id: number;
  change: 'add' | 'update' | 'del';
  value?: HostPermission;
}

export interface IOnboardingAddMembers {
  members_to_add: IHostMemberChangeRequest[];
}

export interface IOnboardingSubscriptionConfiguration {
  tier: HostSubscriptionLevel;
}
