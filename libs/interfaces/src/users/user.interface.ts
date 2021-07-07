import {
  HostPermission,
  IHost,
  IHostStub,
  ILocale,
  IPersonInfo,
  NUUID,
} from '@core/interfaces';

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
  is_admin?: boolean; //site admin global perms
}

// Language and region in single enum of strings ('language/REGION')
export enum LocaleOptions {
  English = 'en-GB',
  Welsh = 'cy-GB',
  Norwegian = 'nb-NO'
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

export interface IFollow {
  _id: NUUID;
  follow_date: number;
  user__id: NUUID;
  host__id: NUUID;
}

// Follows can be seen as from 2 perspectives. The host wants to see the users that follow them (and does not need their ID attached to each follow).
// Likewise, the user that follows multiple hosts does not want to have the user ID attached to each follow.
export type IFollower = Omit<IFollow, "host__id">
export type IFollowing = Omit<IFollow, "user__id">
