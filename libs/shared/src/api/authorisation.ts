import { Environment, ErrCode, NUUID } from '@core/interfaces';
import { DataConnections } from './providers';
import { Request } from 'express';

export type IdFinderStrategy = <T>(req: Request, dc: DataConnections<T>) => Promise<NUUID | null>;
export type AuthStrategy = <T>(
  req: Request,
  dc: DataConnections<T>,
  idMap?: Record<string, NUUID>
) => Promise<AuthStratReturn>;

export type AuthStratReturn = [boolean, { [index: string]: any }, ErrCode?];

export type NUUIDMap = Record<string, NUUID>;
export type MapAccessor = (map: NUUIDMap) => NUUID;

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

const none: AuthStrategy = async (req, dc): Promise<AuthStratReturn> => {
  return [true, {}];
};

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
const custom = (f: <T>(request?: Request, dc?: DataConnections<T>) => boolean): AuthStrategy => {
  return async (req, dc): Promise<AuthStratReturn> => {
    const res = f(req, dc);
    return [res, {}, res ? ErrCode.MISSING_PERMS : null];
  };
};


export default {
  none,
  not,
  and,
  or,
  custom,
  runner
};
