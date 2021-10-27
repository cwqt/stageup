import { HostPermission, IEnvelopedData, IHost, ILocale, IPersonInfo, ConsentOpt } from '@core/interfaces';
import { IFollowing } from './follow.interface';

export type DtoLogin = Pick<IUserPrivate, 'email_address'> & { password: string };
export type DtoCreateUser = Pick<IUserPrivate, 'username' | 'email_address'> & { password: string };
export type DtoUpdateUser = Pick<IUserPrivate, 'email_address' | 'name' | 'bio'>;

export interface IUserStub {
  _id: string;
  name: string;
  username: string;
  avatar?: string; //s3 bucket url
}

export interface IUser extends IUserStub {
  created_at: number;
  cover_image?: string; //s3 bucket url
  bio?: string;
  locale?: ILocale;
  is_verified: boolean; //has completed email verification
  is_new_user: boolean; //gone through first time setup
  is_hiding_host_marketing_prompts: boolean; // has specified they want to hide prompts regarding host marketing in the future
  is_admin?: boolean; //site admin global perms
}

export interface IUserPrivate extends IUser {
  email_address: string;
  salt?: string; //salt
  pw_hash?: string; //password hash
  personal_details: IPersonInfo;
  stripe_customer_id: string; // cus_XXX on Platform account
}

export interface IUserHostInfo {
  joined_at: number; // when the user joined host
  permissions: HostPermission; // host permission level
  user?: IUserStub; // the user who is a member of the host
  prefers_dashboard_landing: boolean; // where the host member would prefer landing page to be
}

export type IUserMarketingInfo = { _id: string; name: string; username: string; email_address: string, opt_status: string }

export type DtoUserMarketingInfo = IEnvelopedData<IUserMarketingInfo[], { last_updated: number }>;

export interface IMyself {
  // Send along private e-mail address when requesting the users own account
  user: IUser & { email_address: IUserPrivate['email_address'] };
  host?: IHost;
  host_info?: IUserHostInfo;
  following?: IFollowing[];
}

// For normal users, outside of a Host
export enum UserPermission {
  SiteAdmin = 'site_admin',
  User = 'user',
  None = 'none' // allow non-users to browse
}

export interface IPasswordConfirmationResponse {
  is_valid: boolean;
}
