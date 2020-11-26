import { INode } from "../Node.model";

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
}

export interface IUserPrivate extends IUser {
  salt?: string;    //salt
  pw_hash?: string; //password hash
}
