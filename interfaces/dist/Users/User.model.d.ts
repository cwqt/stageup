import { INode } from "../Node.model";
export interface IUserStub extends INode {
    name: string;
    username: string;
    avatar?: string;
}
export interface IUser extends IUserStub {
    email_address: string;
    cover_image?: string;
    bio?: string;
    is_verified: boolean;
    is_new_user: boolean;
    is_admin?: boolean;
}
export interface IUserPrivate extends IUser {
    salt?: string;
    pw_hash?: string;
}
