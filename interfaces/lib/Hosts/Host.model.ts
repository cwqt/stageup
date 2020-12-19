import { IUserHostInfo, IUserStub } from '../Users/User.model';
import { IPerformanceStub } from '../Performances/Performance.model';
import { IContactInfo } from '../Users/Person.model';

export interface IHostStub {
  _id: number;
  name: string;
  username: string;
  bio?: string;
  avatar?: string;
}

export interface IHost extends IHostStub {
  members: IUserStub[];
  members_info: IUserHostInfo[];
  social_info: ISocialInfo;
  performances: IPerformanceStub[];
  created_at: number;
  is_onboarded: boolean;
}
export interface ISocialInfo {
  linkedin_url: string;
  facebook_url: string;
  instagram_url: string;
}

export enum HostPermission {
  Owner, // can delete host
  Admin, // can create / delete performances
  Editor, // can edit performance information
  Member, // can view host
}
