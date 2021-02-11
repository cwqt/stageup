import { HostPermission, IHostStub } from "../hosts/host.interface";
import { IPersonInfo } from "./person.interface";

export interface IUserStub {
  _id: string;
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
  email_address: string;
  salt?: string;    //salt
  pw_hash?: string; //password hash
  personal_details: IPersonInfo;
}

export interface IUserHostInfo {
  joined_at: number;  // when the user joined host
  permissions: HostPermission; // host permission level
  user?: IUserStub // The user who is a member of the host
}

export interface IMyself {
  user:IUser;
  host?:IHostStub;
  host_info?:IUserHostInfo
}
