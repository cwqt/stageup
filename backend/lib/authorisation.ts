import { ErrCode, HostPermission } from '@eventi/interfaces';
import { Request } from 'express';
import { DataClient } from './common/data';
import { User } from './models/Users/User.model';
import { Host } from './models/Hosts/Host.model';
import { UserHostInfo } from './models/Hosts/UserHostInfo.model';

export type AuthStratReturn = [boolean, {[index:string]:any}, ErrCode?];
export type AuthStrategy = (req: Request, dc: DataClient) => Promise<AuthStratReturn>;

export const none: AuthStrategy = async (req: Request, dc): Promise<AuthStratReturn> => {
  return [true, {}];
};

export const isLoggedIn: AuthStrategy = async (req: Request, dc: DataClient): Promise<AuthStratReturn> => {
  if (!req.session.user) return [false, {}, ErrCode.NO_SESSION];
  return [true, {}];
};

export const isOurself: AuthStrategy = async (req: Request, dc: DataClient): Promise<AuthStratReturn> => {
  const [isAuthorised, _, reason] = await isLoggedIn(req, dc);
  if (!isAuthorised) return [isAuthorised, _, reason];

  const user = await User.findOne({ _id: parseInt(req.params.uid) });
  if (user._id !== req.session.user._id)
    return [false, {}, ErrCode.NO_SESSION];

  return [true, { user: user }];
};

export const isMemberOfHost: AuthStrategy = async (req: Request, dc: DataClient): Promise<AuthStratReturn> => {
  const [isAuthorised, _, reason] = await isLoggedIn(req, dc);
  if (!isAuthorised) return [isAuthorised, _, reason];

  const user = await User.findOne({ _id: parseInt(req.params.uid) }, { relations: ['host'] });
  if (!user.host) return [false, {}, ErrCode.NOT_MEMBER];

  const host = await Host.findOne({ _id: parseInt(req.params.hid) });
  if (user.host._id !== host._id) return [false, {}, ErrCode.NOT_MEMBER];

  return [true, { user: user }];
};

export const hasHostPermission = (permission: HostPermission): AuthStrategy => {
  return async (req: Request, dc: DataClient): Promise<AuthStratReturn> => {
    const [isMember, passthru, reason] = await isMemberOfHost(req, dc);
    if (!isMember) return [false, {}, reason];

    const userHostInfo = await UserHostInfo.findOne({ user: passthru.user });
    if (userHostInfo.permissions !== permission)
      return [
        false,
        {},
        ErrCode.MISSING_PERMS,
      ];

    return [true, { user: passthru.user }];
  };
};

export const isSiteAdmin: AuthStrategy = async (req: Request, dc: DataClient): Promise<AuthStratReturn> => {
  const [isAuthorised, _, reason] = await isLoggedIn(req, dc);
  if (!isAuthorised) return [isAuthorised, _, reason];

  if (!req.session.user.is_admin) return [false, {}, ErrCode.NOT_ADMIN];
  return [true, {}];
};

/**
 * @description Combine AuthStratgies into an AND operator
 * @param args authStrategy
 */
export const and = (...args: AuthStrategy[]): AuthStrategy => {
  return async (req: Request, dc): Promise<AuthStratReturn> => {
    const isValid = (await Promise.all(args.map((as) => as(req, dc)))).every((r) => r[0] == true);
    return [isValid, {}];
  };
};

/**
 * @description Combine AuthStratgies into an OR operator
 * @param args authStrategy
 */
export const or = (...args: AuthStrategy[]): AuthStrategy => {
  return async (req: Request, dc): Promise<AuthStratReturn> => {
    const isValid = (await Promise.all(args.map((as) => as(req, dc)))).some((r) => r[0] == true);
    return [isValid, {}];
  };
};

/**
 * @description Custom AuthStrategy using HOF
 * @param f Custom function which returns true or false to allow/deny access
 */
export const custom = (f: (req?: Request, dc?: DataClient) => boolean): AuthStrategy => {
  return async (req: Request, dc): Promise<AuthStratReturn> => {
    const res = f(req, dc);
    return [res, {}, res ? ErrCode.INVALID : null];
  };
};

export default {
  none,
  custom,
  or,
  and,
  isOurself,
  isLoggedIn,
  isMemberOfHost,
  hasHostPermission,
  isSiteAdmin,
};
