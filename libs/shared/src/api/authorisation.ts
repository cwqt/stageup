import { i18nToken, NUUID } from '@core/interfaces';
import { Request } from 'express';
import { ProviderMap } from './data-client';

export type IdFinderStrategy = <T extends ProviderMap>(req: Request, pm: T) => Promise<NUUID | null>;
export type AuthStrategy = <T extends ProviderMap>(
  req: Request,
  pm: T,
  idMap?: Record<string, NUUID>
) => Promise<AuthStratReturn>;

export type AuthStratReturn = [boolean, { [index: string]: any }, i18nToken?];

export type NUUIDMap = Record<string, NUUID>;
export type MapAccessor = (map: NUUIDMap) => NUUID;

const runner = (idMap: { [index: string]: IdFinderStrategy }, authStrat: AuthStrategy): AuthStrategy => {
  return async (req, providers) => {
    return authStrat(
      req,
      providers,
      (await Promise.all(Object.values(idMap).map(f => f(req, providers)))).reduce(
        (acc, curr, idx) => ((acc.params[acc.keys[idx]] = curr), acc),
        { params: {}, keys: Object.keys(idMap) }
      ).params
    );
  };
};

const none: AuthStrategy = async (req, providers): Promise<AuthStratReturn> => {
  return [true, {}];
};

/**
 * @description Invert result of passed in Auth strategy
 * @param strategy Auth Strategy to invert
 */
const not = (strategy: AuthStrategy): AuthStrategy => {
  return async (req, providers, map): Promise<AuthStratReturn> => {
    const [valid, passthru, reason]: AuthStratReturn = await strategy(req, providers, map);
    return [!valid, passthru, reason];
  };
};

/**
 * @description Combine AuthStratgies into an AND operator
 * @param args authStrategy
 */
const and = (...args: AuthStrategy[]): AuthStrategy => {
  return async (req, providers, map): Promise<AuthStratReturn> => {
    const isValid = (await Promise.all(args.map(async as => as(req, providers, map)))).every(r => r[0]);
    return [isValid, {}, '@@error.missing_permissions'];
  };
};

/**
 * @description Combine AuthStratgies into an OR operator
 * @param args authStrategy
 */
const or = (...args: AuthStrategy[]): AuthStrategy => {
  return async (req, providers, map): Promise<AuthStratReturn> => {
    const isValid = (await Promise.all(args.map(async as => as(req, providers, map)))).some(r => r[0]);
    return [isValid, {}, '@@error.missing_permissions'];
  };
};

/**
 * @description Custom AuthStrategy using HOF
 * @param f Custom function which returns true or false to allow/deny access
 */
const custom = (f: <T extends ProviderMap>(request?: Request, pm?: T) => boolean): AuthStrategy => {
  return async (req, pm): Promise<AuthStratReturn> => {
    const res = f(req, pm);
    return [res, {}, res ? '@@error.missing_permissions' : null];
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
