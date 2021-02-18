import { IUserHostInfo } from '../users/user.interface';
import { IPerformanceStub } from '../performances/performance.interface';
import { IContactInfo } from '../users/person.interface';
import { IAddress } from '../users/address.interface';
import { NUUID } from '../common/fp.interface';


export interface IHostStub {
  _id: NUUID;
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
  Pending, // hasn't accepted invite
  Expired // had an invite that they didn't accept in time
}
