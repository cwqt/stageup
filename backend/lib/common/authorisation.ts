import { ErrCode, HostPermission } from '@eventi/interfaces';
import { Request } from 'express';
import { DataClient } from './data';
import { User } from '../models/Users/user.model';
import { Host } from '../models/hosts/host.model';
import { UserHostInfo } from '../models/hosts/user-host-info.model';

export type AuthStratReturn = [boolean, Record<string, any>, ErrCode?];
export type AuthStrategy = (request: Request, dc: DataClient) => Promise<AuthStratReturn>;

export const none: AuthStrategy = async (request: Request, dc): Promise<AuthStratReturn> => {
  return [true, {}];
};

export const isLoggedIn: AuthStrategy = async (request: Request, dc: DataClient): Promise<AuthStratReturn> => {
  if (!request.session.user) {
    return [false, {}, ErrCode.NO_SESSION];
  }

  return [true, {}];
};

export const isOurself: AuthStrategy = async (request: Request, dc: DataClient): Promise<AuthStratReturn> => {
  const [isAuthorised, _, reason] = await isLoggedIn(request, dc);
  if (!isAuthorised) {
    return [isAuthorised, _, reason];
  }

  const user = await User.findOne({ _id: Number.parseInt(request.params.uid) });
  if (user._id !== request.session.user._id) {
    return [false, {}, ErrCode.NO_SESSION];
  }

  return [true, { user }];
};

export const isMemberOfHost: AuthStrategy = async (request: Request, dc: DataClient): Promise<AuthStratReturn> => {
  const [isAuthorised, _, reason] = await isLoggedIn(request, dc);
  if (!isAuthorised) {
    return [isAuthorised, _, reason];
  }

  const uhi = await UserHostInfo.findOne({
    relations: {
      user: true,
      host: true
    },
    where: {
      user: {
        _id: request.session.user._id
      },
      host: {
        _id: Number.parseInt(request.params.hid)
      }
    }
  });

  if (!uhi) {
    return [false, {}, ErrCode.NOT_MEMBER];
  }

  return [true, { uhi }];
};

export const hasHostPermission = (permission: HostPermission): AuthStrategy => {
  return async (request: Request, dc: DataClient): Promise<AuthStratReturn> => {
    const [isMember, passthru, reason] = await isMemberOfHost(request, dc);
    if (!isMember) {
      return [false, {}, reason];
    }

    if (passthru.uhi.permissions < permission) {
      return [false, {}, ErrCode.MISSING_PERMS];
    }

    return [true, { user: passthru.user }];
  };
};

export const isSiteAdmin: AuthStrategy = async (request: Request, dc: DataClient): Promise<AuthStratReturn> => {
  const [isAuthorised, _, reason] = await isLoggedIn(request, dc);
  if (!isAuthorised) {
    return [isAuthorised, _, reason];
  }

  if (!request.session.user.is_admin) {
    return [false, {}, ErrCode.NOT_ADMIN];
  }

  return [true, {}];
};

// Export const hasClientSubscriptionTier

/**
 * @description Combine AuthStratgies into an AND operator
 * @param args authStrategy
 */
export const and = (...arguments_: AuthStrategy[]): AuthStrategy => {
  return async (request: Request, dc): Promise<AuthStratReturn> => {
    const isValid = (await Promise.all(arguments_.map(async as => as(request, dc)))).every(r => r[0]);
    return [isValid, {}];
  };
};

/**
 * @description Combine AuthStratgies into an OR operator
 * @param args authStrategy
 */
export const or = (...arguments_: AuthStrategy[]): AuthStrategy => {
  return async (request: Request, dc): Promise<AuthStratReturn> => {
    const isValid = (await Promise.all(arguments_.map(async as => as(request, dc)))).some(r => r[0]);
    return [isValid, {}];
  };
};

/**
 * @description Custom AuthStrategy using HOF
 * @param f Custom function which returns true or false to allow/deny access
 */
export const custom = (f: (request?: Request, dc?: DataClient) => boolean): AuthStrategy => {
  return async (request: Request, dc): Promise<AuthStratReturn> => {
    const res = f(request, dc);
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
  isSiteAdmin
};
