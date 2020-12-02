import { INode } from "../Node.model";
import { IUserStub } from "./User.model";
export interface IHostStub extends INode {
    name: string;
    username: string;
    bio?: string;
    avatar?: string;
}
export interface IHost extends IHostStub {
    members: IUserStub[];
}
export declare enum IHostPermission {
    Admin = 0,
    Editor = 1,
    Member = 2
}
