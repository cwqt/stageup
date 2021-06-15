import { IUserHostInfo } from '../users/user.interface';
import { IPerformanceStub } from '../performances/performance.interface';
import { IContactInfo } from '../users/person.interface';
import { IAddress } from '../users/address.interface';
import { Idless, NUUID } from '../common/fp.interface';

export type DtoCreateHost = Pick<IHostPrivate, 'email_address' | 'username' | 'name'>;

export enum HostType {
  Individual = 'individual',
  Company = 'company',
  NonProfit = 'non_profit',
  GovernmentEntity = 'gov_entity'
}

export interface IHostStub {
  _id: NUUID;
  name: string;
  username: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  stripe_account_id: string;
}

export interface IHost extends IHostStub {
  social_info: ISocialInfo;
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
  business_contact_number: string; // e.164 format
  business_address: Idless<IAddress>;
  vat_number: string; // e.g GB123456789 or GB123456789102
}

export interface ISocialInfo {
  site_url: string;
  linkedin_url: string;
  facebook_url: string;
  instagram_url: string;
}

export enum HostPermission {
  Owner = 'host_owner', // can delete host
  Admin = 'host_admin', // can create / delete performances
  Editor = 'host_editor', // can edit performance information
  Member = 'host_member', // has accepted & can view host
  Pending = 'host_pending', // hasn't accepted invite
  Expired = 'host_expired' // had an invite that they didn't accept in time
}

const HOST_PERMISSIONS_AS_VALUES = [...Object.values(HostPermission)] as const;
/**
 * @description Checks if 'current' has permissions of 'required' - since it operates off inheritance with HostPermission string enum
 * @param current The current HostPermission
 * @param required The required HostPermission
 */
export const hasRequiredHostPermission = (current: HostPermission, required: HostPermission): boolean => {
  return HOST_PERMISSIONS_AS_VALUES.indexOf(current) > HOST_PERMISSIONS_AS_VALUES.indexOf(required);
};

export interface IHostStripeInfo {
  is_stripe_connected: boolean;
}

export interface IDeleteHostAssertion {
  can_delete: boolean;
  due_performances?: IPerformanceStub[];
  live_performances?: IPerformanceStub[];
}

export enum DeleteHostReason {
  UnpleasantExperience = 'unpleasant_experience',
  DissatisfactoryUX = 'dissatisfactory_ux',
  UnhappyWithComission = 'unhappy_w_comission',
  SUDidNotAddressBusinessIssue = 'stageup_not_address_business_issue',
  DidNotWantToOfferDigitalPerfs = 'not_want_issue_digital_perfs'
}

export interface IDeleteHostReason {
  reasons: DeleteHostReason[];
  explanation: string;
}
