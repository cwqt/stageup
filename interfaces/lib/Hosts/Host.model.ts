import { IUserHostInfo, IUserStub } from '../Users/User.model';
import { IPerformanceStub } from '../Performances/Performance.model';

export interface IHostStub {
  _id: number;
  name: string;
  username: string;
  bio?: string;
  avatar?: string;
}

export interface IHost extends IHostStub {
  members: IUserStub[];
  members_info: IUserHostInfo[];
  performances: IPerformanceStub[];
  created_at: number;
  is_onboarded: boolean;
  social_info: ISocialInfo;
}
export interface ISocialInfo {
  linkedin_url: string;
  facebook_url: string;
  instagram_url: string;
}

export enum HostPermission {
  Owner, // can delete host
  Admin, // can create / delete performances
  Editor, // can edit performance information
  Member, // can view host
}

// ONBOARDING ------------------------------------------------------------------------
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

export interface IHostOnboardingProcess {
  verified: boolean; // eventi has verified the step
  complete: boolean; //
  started_at: number;
  completed_at: number | null;
  steps: IHostOnboardingStep<any>[];
}

export interface IHostOnboardingStep<T> {
  verified: boolean;
  complete: boolean;
  data: T;
}

export interface IOnboardingProofOfBusiness {
  owner_name: string;
  hmrc_company_number: number;
  contact_number: number;
}
