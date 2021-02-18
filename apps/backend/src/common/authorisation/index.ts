import { Environment, ErrCode, HostPermission, IHost, NUUID } from '@core/interfaces';
import { Request } from 'express';
import { DataClient } from '../data';
import { User } from '../../models/users/user.model';
import { UserHostInfo } from '../../models/hosts/user-host-info.model';
import Env from '../../env';
import { Host } from '../../models/hosts/host.model';
import { IdFinderStrategy } from './id-finder-strategies';

// Authorisation Strategies ------------------------------------------------------------------------------------------
const runner = (idMap: { [index: string]: IdFinderStrategy }, authStrat: AuthStrategy): AuthStrategy => {
  return async (req, dc) => {
    return authStrat(
      req,
      dc,
      (await Promise.all(Object.values(idMap).map(f => f(req, dc)))).reduce(
        (acc, curr, idx) => ((acc.params[acc.keys[idx]] = curr), acc),
        { params: {}, keys: Object.keys(idMap) }
      ).params
    );
  };
};



export type AuthStratReturn = [boolean, { [index: string]: any }, ErrCode?];
export type AuthStrategy = (req: Request, dc: DataClient, idMap?: Record<string, NUUID>) => Promise<AuthStratReturn>;

export type NUUIDMap = Record<string, NUUID>;
export type MapAccessor = (map:NUUIDMap) => NUUID;


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

  const user = await User.findOne({ _id: req.params.uid });
  if (user._id !== req.session.user._id) {
    return [false, {}, ErrCode.NO_SESSION];
  }

  return [true, { user }];
};

const isMemberOfHost = (mapAccessor?: MapAccessor, passedMap?:NUUIDMap): AuthStrategy => {
  return async (req, dc, map): Promise<AuthStratReturn> => {
    const [isAuthorised, _, reason] = await isLoggedIn(req, dc);
    if (!isAuthorised) return [isAuthorised, _, reason];

    const hostId = mapAccessor ? mapAccessor(passedMap || map) : req.params.hid;

    const uhi = await UserHostInfo.findOne({
      relations: ['user', 'host'],
      where: {
        user: {
          _id: req.session.user._id
        },
        host: {
          _id: hostId
        }
      },
      select: { permissions: true, _id: true, user: { _id: true }, host: { _id: true } }
    });

    if (!uhi) return [false, {}, ErrCode.NOT_MEMBER];
    if (uhi && uhi.permissions == HostPermission.Expired) return [false, {}, ErrCode.NOT_MEMBER];

    return [true, { uhi }];
  };
};

const hasHostPermission = (permission: HostPermission, mapAccessor?: MapAccessor): AuthStrategy => {
  return async (req, dc, map): Promise<AuthStratReturn> => {
    // Pass this NUUIDMap down to the isMemberOfHost Auth Strategy
    const [isMember, passthru, reason] = await isMemberOfHost(mapAccessor, map)(req, dc);
    if (!isMember) return [false, {}, reason];

    // Highest Perms (Owner)  = 0
    // Lowest Perfs (Pending) = 5
    if (passthru.uhi.permissions > permission) {
      return [false, {}, ErrCode.MISSING_PERMS];
    }

    return [true, { user: passthru.user }];
  };
};

const hasSpecificHostPermission = (permission: HostPermission): AuthStrategy => {
  return async (req, dc): Promise<AuthStratReturn> => {
    const [isMember, passthru, reason] = await isMemberOfHost()(req, dc);
    if (!isMember) return [false, {}, reason];

    if (passthru.uhi.permissions !== permission) {
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
    if (!Env.isEnv(env)) return [false, {}, ErrCode.UNKNOWN];
    return [true, {}];
  };
};

/**
 * @description Is currently running on a live, deployed instance
 */
const isLive: AuthStrategy = async (req, dc): Promise<AuthStratReturn> => {
  if (Env.isEnv(Environment.Staging) || Env.isEnv(Environment.Production)) {
    return [true, {}];
  } else {
    return [false, {}];
  }
};

const hostIsOnboarded = (mapAccessor?: MapAccessor): AuthStrategy => {
  return async (req, dc, map): Promise<AuthStratReturn> => {
    const hostId: IHost['_id'] = mapAccessor ? await mapAccessor(map) : req.params.hid;
    if (!hostId) return [false, {}, ErrCode.MISSING_FIELD];

    // Find if the host is onboarded or not
    const host = await Host.findOne(
      {
        _id: hostId
      },
      {
        select: {
          is_onboarded: true
        }
      }
    );

    if (!host) return [false, {}, ErrCode.NOT_FOUND];
    if (!host.is_onboarded) return [false, {}, ErrCode.NOT_VERIFIED];

    return [true, { host }];
  };
};

const userEmailIsVerified = (mapAccessor?:MapAccessor): AuthStrategy => {
  return async (req, dc, map): Promise<AuthStratReturn> => {
    const userId = mapAccessor ? await mapAccessor(map) : req.params.uid;
    if (!userId) return [false, {}, ErrCode.MISSING_FIELD];

    const user = await User.findOne(
      {
        _id: userId
      },
      { select: { is_verified: true } }
    );
    if (!user) return [false, {}, ErrCode.NOT_FOUND];
    if (!user.is_verified) return [false, {}, ErrCode.NOT_VERIFIED];

    return [true, {}];
  };
};

// Combinators ---------------------------------------------------------------------------------------------------------

/**
 * @description Invert result of passed in Auth strategy
 * @param strategy Auth Strategy to invert
 */
const not = (strategy: AuthStrategy): AuthStrategy => {
  return async (req, dc, map): Promise<AuthStratReturn> => {
    const [valid, passthru, reason]: AuthStratReturn = await strategy(req, dc, map);
    return [!valid, passthru, reason];
  };
};

/**
 * @description Combine AuthStratgies into an AND operator
 * @param args authStrategy
 */
const and = (...args: AuthStrategy[]): AuthStrategy => {
  return async (req, dc, map): Promise<AuthStratReturn> => {
    const isValid = (await Promise.all(args.map(async as => as(req, dc, map)))).every(r => r[0]);
    return [isValid, {}, ErrCode.MISSING_PERMS];
  };
};

/**
 * @description Combine AuthStratgies into an OR operator
 * @param args authStrategy
 */
const or = (...args: AuthStrategy[]): AuthStrategy => {
  return async (req, dc, map): Promise<AuthStratReturn> => {
    const isValid = (await Promise.all(args.map(async as => as(req, dc, map)))).some(r => r[0]);
    return [isValid, {}, ErrCode.MISSING_PERMS];
  };
};

/**
 * @description Custom AuthStrategy using HOF
 * @param f Custom function which returns true or false to allow/deny access
 */
const custom = (f: (request?: Request, dc?: DataClient) => boolean): AuthStrategy => {
  return async (req, dc): Promise<AuthStratReturn> => {
    const res = f(req, dc);
    return [res, {}, res ? ErrCode.MISSING_PERMS : null];
  };
};

export default {
  runner,
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
  hostIsOnboarded,
  userEmailIsVerified,
  hasHostPermission,
  hasSpecificHostPermission,
  isSiteAdmin
};
