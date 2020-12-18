import { IUserHostInfo, IUserStub } from "./User.model";
import { IPerformanceStub } from './Performance.model';

export interface IHostStub {
    _id: number;
    name: string;
    username: string;
    bio?:string;
    avatar?: string;
}

export interface IHost extends IHostStub {
    members: IUserStub[];
    members_info: IUserHostInfo[];
    performances: IPerformanceStub[];
    created_at: number;
    is_onboarded:boolean;
}

export interface IHostPrivateInfo {
  hmrc_company_number: number;
  contact_number:number;
  email_address:string;
  owner_details:IPerson;
  billing_address: IAddress;
  mailing_address: IAddress;
}

export interface IPerson {
  date_of_birth: string;
  first_name: string;
  last_name: string;
  title: PersonTitle
}

export enum PersonTitle {
  Mr = "mr",
  Mrs = "mrs",
  Ms = "ms",
  Miss = "miss",
  Master = "master",
  Dr = "dr",
  Professor = "professor"
}

export interface IContactInfo {
  phone_number: number;
  linkedin_url: string;
  facebook_url: string;
  instagram_url: string;
  address: string;
}

export interface IAddress {
  city: string;
  country: string;
  postcode: string;
  street_name: string;
  street_number: string;
  state?: string; //US-based
  zip_code?: string; //US-based
}

export enum HostPermission {
    Owner, // can delete host
    Admin, // can create / delete performances
    Editor, // can edit performance information
    Member // can view host
}

// ONBOARDING ------------------------------------------------------------------------
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
  contact_number:number;
}

export interface IOnboardingSocialPresence {}

export interface IOnboarding

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