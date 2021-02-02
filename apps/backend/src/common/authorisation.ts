import { ErrCode, HostPermission } from '@eventi/interfaces';
import { Request } from 'express';
import { DataClient } from './data';
import { User } from '../models/users/user.model';
import { UserHostInfo } from '../models/hosts/user-host-info.model';
import config, { Environment } from '../config';
import { Host } from '../models/hosts/host.model';
import { Performance } from '../models/performances/performance.model';

export type AuthStratReturn = [boolean, { [index: string]: any }, ErrCode?];
export type AuthStrategy = (req: Request, dc: DataClient) => Promise<AuthStratReturn>;

const none: AuthStrategy = async (req, dc): Promise<AuthStratReturn> => {
  return [true, {}];
};

const isLoggedIn: AuthStrategy = async (req, dc): Promise<AuthStratReturn> => {
  if (!req.session.user) {
    return [false, {}, ErrCode.NO_SESSION];
  }

  return [true, {}];
};

const isOurself: AuthStrategy = async (req, dc): Promise<AuthStratReturn> => {
  const [isAuthorised, _, reason] = await isLoggedIn(req, dc);
  if (!isAuthorised) {
    return [isAuthorised, _, reason];
  }

  const user = await User.findOne({ _id: Number.parseInt(req.params.uid) });
  if (user._id !== req.session.user._id) {
    return [false, {}, ErrCode.NO_SESSION];
  }

  return [true, { user }];
};

const isMemberOfHost: AuthStrategy = async (req, dc): Promise<AuthStratReturn> => {
  const [isAuthorised, _, reason] = await isLoggedIn(req, dc);
  if (!isAuthorised) return [isAuthorised, _, reason];

  let hostId = req.params.hid ? Number.parseInt(req.params.hid) : null;

  // For performances - check intersection between performance host & user host
  if (!hostId && req.params.pid) {
    const performance = await Performance.findOne({
      relations: {
        host: {
          members_info: {
            user: true
          }
        }
      },
      where: {
        _id: Number.parseInt(req.params.pid),
        host: {
          members_info: {
            user: {
              _id: req.session.user._id
            }
          }
        }
      }
    });

    if (!performance) return [false, {}, ErrCode.NOT_MEMBER];
    hostId = performance.host._id;
  }

  const uhi = await UserHostInfo.findOne({
    relations: ['user', 'host'],
    where: {
      user: {
        _id: req.session.user._id
      },
      host: {
        _id: hostId
      }
    }
  });

  if (!uhi) return [false, {}, ErrCode.NOT_MEMBER];
  return [true, { uhi }];
};

const hasHostPermission = (permission: HostPermission): AuthStrategy => {
  return async (req, dc): Promise<AuthStratReturn> => {
    const [isMember, passthru, reason] = await isMemberOfHost(req, dc);
    if (!isMember) {
      return [false, {}, reason];
    }

    // Highest Perms (Owner)  = 0
    // Lowest Perfs (Pending) = 4
    if (passthru.uhi.permissions > permission) {
      return [false, {}, ErrCode.MISSING_PERMS];
    }

    return [true, { user: passthru.user }];
  };
};

const isSiteAdmin: AuthStrategy = async (req, dc): Promise<AuthStratReturn> => {
  const [isAuthorised, _, reason] = await isLoggedIn(req, dc);
  if (!isAuthorised) {
    return [isAuthorised, _, reason];
  }

  if (!req.session.user.is_admin) {
    return [false, {}, ErrCode.NOT_ADMIN];
  }

  return [true, {}];
};

const isEnv = (env: Environment): AuthStrategy => {
  return async (req, dc): Promise<AuthStratReturn> => {
    if (!config.isEnv(env)) return [false, {}, ErrCode.UNKNOWN];
    return [true, {}];
  };
};


/**
 * @description Is currently running on a live, deployed instance
 */
const isLive: AuthStrategy = async (req, dc): Promise<AuthStratReturn> => {
  if (config.isEnv(Environment.Staging) || config.isEnv(Environment.Production)) {
    return [true, {}];
  } else {
    return [false, {}];
  }
};

/**
 * @description Invert result of passed in Auth strategy
 * @param strategy Auth Strategy to invert
 */
const not = (strategy: AuthStrategy): AuthStrategy => {
  return async (req, dc): Promise<AuthStratReturn> => {
    const [valid, passthru, reason]: AuthStratReturn = await strategy(req, dc);
    return [!valid, passthru, reason];
  };
};

/**
 * @description Combine AuthStratgies into an AND operator
 * @param args authStrategy
 */
const and = (...arguments_: AuthStrategy[]): AuthStrategy => {
  return async (request: Request, dc): Promise<AuthStratReturn> => {
    const isValid = (await Promise.all(arguments_.map(async as => as(request, dc)))).every(r => r[0]);
    return [isValid, {}];
  };
};

/**
 * @description Combine AuthStratgies into an OR operator
 * @param args authStrategy
 */
const or = (...arguments_: AuthStrategy[]): AuthStrategy => {
  return async (request: Request, dc): Promise<AuthStratReturn> => {
    const isValid = (await Promise.all(arguments_.map(async as => as(request, dc)))).some(r => r[0]);
    return [isValid, {}];
  };
};

/**
 * @description Custom AuthStrategy using HOF
 * @param f Custom function which returns true or false to allow/deny access
 */
const custom = (f: (request?: Request, dc?: DataClient) => boolean): AuthStrategy => {
  return async (request: Request, dc): Promise<AuthStratReturn> => {
    const res = f(request, dc);
    return [res, {}, res ? ErrCode.INVALID : null];
  };
};

export default {
  none,
  custom,
  and,
  or,
  not,
  isEnv,
  isLive,
  isOurself,
  isLoggedIn,
  isMemberOfHost,
  hasHostPermission,
  isSiteAdmin
};
