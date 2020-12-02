import { INode } from "../Node.model";
import { IUserStub } from "./User.model";
import { IPerformanceStub } from '../Performance.model';

export interface IHostStub extends INode {
    name: string;
    username: string;
    bio?:string;
    avatar?: string;
}

export interface IHost extends IHostStub {
    members: IUserStub[];
    // performances: IPerformanceStub[];
}

export enum IHostPermission {
    Admin, // can create / delete performances
    Editor, // can edit performance information
    Member // can view host
  }