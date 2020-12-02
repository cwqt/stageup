import { INode } from "../Node.model";
import { IPerformanceStub } from "../Performance.model";
import { CurrencyCode } from "../Types/Currency.types";
import { IHostPermission } from "./Host.model";

export interface IUserStub extends INode {
  name: string;
  username: string;
  avatar?: string;  //s3 bucket url
}

export interface IUser extends IUserStub {
  email_address: string;
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
}

export interface IPerformancePurchase {
  date_purchased: number;
  price: number;
  currency: CurrencyCode;
  performance: IPerformanceStub;
}

export interface IUserHostInfo {
  joined_at: number;  // when the user joined host
  is_owner: boolean;  // if the user can delete / make all changes to host
  permissions: IHostPermission; // host permission level
}