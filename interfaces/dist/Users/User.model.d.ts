import { INode } from "../Node.model";
import { IPerformanceStub } from "../Performance.model";
import { CurrencyCode } from "../Types/Currency.types";
import { IHostPermission } from "./Host.model";
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
export interface IPerformancePurchase {
    date_purchased: number;
    price: number;
    currency: CurrencyCode;
    performance: IPerformanceStub;
}
export interface IUserHostInfo {
    joined_at: number;
    is_owner: boolean;
    permissions: IHostPermission;
}
