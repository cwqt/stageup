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
  banner?: string;
}

export interface IHost extends IHostStub {
  members_info: IUserHostInfo[];
  social_info: ISocialInfo;
  performances: IPerformanceStub[];
  created_at: number;
  is_onboarded: boolean;
}

export type IHostPrivate = {
  stripe_account_id: string;
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
  Owner = "host_owner", // can delete host
  Admin = "host_admin", // can create / delete performances
  Editor = "host_editor", // can edit performance information
  Member = "host_member", // has accepted & can view host
  Pending = "host_pending", // hasn't accepted invite
  Expired = "host_expired" // had an invite that they didn't accept in time
}

const HOST_PERMISSIONS_AS_VALUES = [...Object.values(HostPermission)] as const;
/**
 * @description Checks if 'current' has permissions of 'required' - since it operates off inheritance with HostPermission string enum
 * @param current The current HostPermission
 * @param required The required HostPermission
 */
export const hasRequiredHostPermission = (current:HostPermission, required:HostPermission): boolean => {
  return HOST_PERMISSIONS_AS_VALUES.indexOf(current) > HOST_PERMISSIONS_AS_VALUES.indexOf(required)
}

export interface IHostStripeInfo {
  is_stripe_connected: boolean;
}