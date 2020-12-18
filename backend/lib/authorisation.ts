import { HostPermission } from '@eventi/interfaces';
import { Request } from 'express';
import { DataClient } from './common/data';
import { User } from './models/Users/User.model';
import { Host } from'./models/Hosts/Host.model';
import { UserHostInfo } from './models/Hosts/UserHostInfo.model';

export type AuthStrategy = (req: Request, dc: DataClient) => Promise<[boolean, { [index: string]: any }?, string?]>;

export const none:AuthStrategy = async (req:Request, dc):Promise<[boolean, {}, string?]> => {
    return [true, {}];
}

export const isLoggedIn: AuthStrategy = async (req: Request, dc: DataClient): Promise<[boolean, {}, string?]> => {
  if (!req.session.user) return [false, {}, "You must be logged in to perform this action"];
  return [true, {}];
};

export const isOurself:AuthStrategy = async (req:Request, dc:DataClient):Promise<[boolean, {}, string?]> => {
  const user = await User.findOne({ _id: parseInt(req.params.uid) });
  if(user._id !== req.session.user._id) return [false, {}, "You must be logged in as this user to perform actions on them"];
  
  return [true, { user: user }];
}

export const isMemberOfHost: AuthStrategy = async (req: Request, dc: DataClient): Promise<[boolean, {}, string?]> => {
  const user = await User.findOne({ _id: parseInt(req.params.uid) }, { relations: ["host"] });
  if(!user.host) return [false, {}, "User is not part of any host"];

  const host = await Host.findOne({ _id: parseInt(req.params.hid)});
  if(user.host._id !== host._id) return [false, {}, "User is not part of this host"];

  return [true, { user: user }];
};

export const hasHostPermission = (permission: HostPermission): AuthStrategy => {
  return async (req: Request, dc: DataClient): Promise<[boolean, {}, string?]> => {
    const [isMember, passthru, reason] = await isMemberOfHost(req, dc);
    if(!isMember) return [false, {}, reason];

    const userHostInfo = await UserHostInfo.findOne({ user: passthru.user });
    if(userHostInfo.permissions !== permission) return [false, {}, `User does not have neccessary permissions, needs ${permission} got ${userHostInfo.permissions}`];
    
    return [true, { user: passthru.user }];
  };
};

export default {
    none,
    isOurself,
    isLoggedIn,
    isMemberOfHost,
    hasHostPermission
}