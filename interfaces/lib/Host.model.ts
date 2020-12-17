import { IUserHostInfo, IUserStub } from "./User.model";
import { IPerformanceStub } from './Performance.model';

export interface IHostStub {
    _id: number;
    name: string;
    username: string;
    bio?:string;
    avatar?: string;
}

export interface IHost extends IHostStub {
    members: IUserStub[];
    members_info: IUserHostInfo[];
    performances: IPerformanceStub[];
    email_address:string;
    created_at: number;
    is_onboarded:boolean;
}

export enum HostPermission {
    Owner, // can delete host
    Admin, // can create / delete performances
    Editor, // can edit performance information
    Member // can view host
}