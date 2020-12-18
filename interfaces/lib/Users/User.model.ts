import { IPerformanceStub } from "../Performances/Performance.model";
import { CurrencyCode } from "../Common/Currency.types";
import { HostPermission, IHost, IHostStub } from "../Hosts/Host.model";

export interface IUserStub {
  _id: number;
  name: string;
  username: string;
  avatar?: string;  //s3 bucket url
}

export interface IUser extends IUserStub {
  created_at:number;
  cover_image?: string; //s3 bucket url
  bio?: string;
  is_verified: boolean; //has completed email verification
  is_new_user: boolean; //gone through first time setup
  is_admin?: boolean;   //site admin global perms
  // purchases: IPerformancePurchase[]; // performances for which the user has bought
}

export interface IUserPrivate extends IUser {
  salt?: string;    //salt
  pw_hash?: string; //password hash
  personal_details: IPersonInfo;
}

export interface IPerformancePurchase {
  date_purchased: number;
  price: number;
  currency: CurrencyCode;
  performance: IPerformanceStub;
}

export interface IUserHostInfo {
  joined_at: number;  // when the user joined host
  permissions: HostPermission; // host permission level
}

export interface IMyself {
  user:IUser;
  host?:IHostStub;
  host_info?:IUserHostInfo
}

// PERSON ---------------------------------------------------------------------------------------------
export interface IPersonInfo {
  first_name: string;
  last_name: string;
  title: PersonTitle;
  contact_info: IContactInfo;
  billing_info: IBillingInfo;
}

export interface IContactInfo {
  mobile_number: number;
  landline_number: number;
  addresses: IAddress[];
}

export interface IBillingInfo {
  first_name: string;
  last_name: string;
  address: IAddress;
  stripe_id: string;
}

export interface IAddress {
  city: string;
  iso_country_code: string;
  postcode: string;
  street_name: string;
  street_number: string;
  state?: string; //US-based
  zip_code?: string; //US-based
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