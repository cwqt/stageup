import { IUserHostInfo } from '../users/user.model';
import { IPerformanceStub } from '../performances/performance.model';
import { IAddress, IContactInfo } from '../users/person.model';

export interface IHostStub {
  _id: number;
  name: string;
  username: string;
  bio?: string;
  avatar?: string;
}

export interface IHost extends IHostStub {
  members_info: IUserHostInfo[];
  social_info: ISocialInfo;
  performances: IPerformanceStub[];
  created_at: number;
  is_onboarded: boolean;
}

export type IHostPrivate = {
  email_address: string;
  contact_info: IContactInfo;
  business_details: IHostBusinessDetails;
} & IHost;

export interface IHostBusinessDetails {
  hmrc_company_number: number;
  business_contact_number: number;
  business_address: IAddress;
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
  Member, // has accepted & can view host
  Pending // hasn't accepted invite
}
