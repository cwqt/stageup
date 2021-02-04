require('dotenv').config();
import Axios from 'axios';
import { HostPermission, IUserPrivate } from '@core/interfaces';
import { Stories } from './stories';

export enum UserType {
  SiteAdmin = 4, // highest permisison level
  Owner = HostPermission.Owner, // member of a host Hos
  Admin = HostPermission.Admin, // member of a host
  Editor = HostPermission.Editor, // member of a host
  Member = HostPermission.Member, // member of a host
  Client = 5, // general view
  None = 6, // no session
}

const actorNameMap:{[index in UserType]:string} = {
  [UserType.SiteAdmin]: 'Site Admin',
  [UserType.Owner]: 'Host Owner',
  [UserType.Admin]: 'Host Admin',
  [UserType.Editor]: 'Host Editor',
  [UserType.Member]: 'Host Member',
  [UserType.Client]: 'Host Client',
  [UserType.None]: 'No Account'
}

export interface IEnvironment {
  baseUrl: string;
  getHeaders: Function;
  getOptions: Function;
  userActorNameMap: typeof actorNameMap;
  userCreationData: { [index in UserType]: Pick<IUserPrivate, 'email_address' | 'username'> & { password: string } };
}

const makeUserData = (email: string, username: string, pass: string) => ({
  email_address: email,
  username: username,
  password: pass,
});

export const environment: IEnvironment = {
  baseUrl: process.env['BASE_URL'] as string,
  userActorNameMap: actorNameMap,
  getOptions: () => ({ headers: environment.getHeaders(), withCredentials: true }),
  getHeaders: () => {
    return {
      Cookie: Stories.getActiveUser()?.session || "",
      'Content-Type': 'application/json',
    };
  },
  userCreationData: {
    [UserType.SiteAdmin]: makeUserData('siteadmin@cass.si', 'siteadmin', 'siteadmin'),
    [UserType.Owner]: makeUserData('hostowner@cass.si', 'hostowner', 'hostowner'),
    [UserType.Admin]: makeUserData('hostadmin@cass.si', 'hostadmin', 'hostadmin'),
    [UserType.Editor]: makeUserData('hosteditor@cass.si', 'hosteditor', 'hosteditor'),
    [UserType.Member]: makeUserData('hostmember@cass.si', 'hostmember', 'hostmember'),
    [UserType.Client]: makeUserData('eventiclient@cass.si', 'hostclient', 'hostclient'),
    [UserType.None]: makeUserData('eventinone@cass.si', '', ''),
  },
};

export const api = Axios.create({
  baseURL: environment.baseUrl || "http://localhost:3000",
});