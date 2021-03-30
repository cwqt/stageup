import { Request, Response, NextFunction } from 'express';
import { IRouterMatcher } from 'express-serve-static-core';
import { AsyncRouter as ExpressAsyncRouter, AsyncRouterInstance } from 'express-async-router';
import { HTTP } from '@core/interfaces';

import { Auth, ErrorHandler, handleError } from '@core/shared/api';
import { AuthStrategy } from './authorisation';
import { IControllerEndpoint } from '@core/shared/api';
import { validatorMiddleware } from './validate';
import { Logger } from 'winston';
import { IMiddlewareConnections, Middlewares } from './middleware';
import { ProviderMap } from './data-client';
import { Middleware } from 'express-validator/src/base';

export default <K extends ProviderMap>(
  providerMap: K,
  globalAuth: AuthStrategy,
  middlewares: IMiddlewareConnections,
  logger: Logger
) => {
  const router = new AsyncRouter(providerMap, globalAuth, logger);
  const mws = new Middlewares(middlewares);

  return (f: (router: AsyncRouter<K>, providerMap: K, mws: Middlewares) => void): AsyncRouter<K> => {
    f(router, providerMap, mws);
    return router;
  };
};

export interface IResLocals {
  pagination?: {
    per_page: number;
    page: number;
  };
}

export class AsyncRouter<PM extends ProviderMap> {
  router: AsyncRouterInstance;
  provider_map: PM;
  auth: AuthStrategy;
  logger: Logger;

  constructor(providerMap: PM, auth: AuthStrategy, logger: Logger) {
    this.router = ExpressAsyncRouter();
    this.provider_map = providerMap;
    this.auth = auth;
    this.logger = logger;
  }

  use = (path: string, router: Middleware) => {
    this.router.use(path, router);
  };

  get = <T>(path: string, endpoint: IControllerEndpoint<T>) => {
    endpointFunction<T, PM>(this.router.get, this.provider_map, this.logger, this.auth)(path, endpoint);
  };

  put = <T>(path: string, endpoint: IControllerEndpoint<T>) => {
    endpointFunction<T, PM>(this.router.put, this.provider_map, this.logger, this.auth)(path, endpoint);
  };

  post = <T>(path: string, endpoint: IControllerEndpoint<T>) => {
    endpointFunction<T, PM>(this.router.post, this.provider_map, this.logger, this.auth)(path, endpoint);
  };

  delete = <T>(path: string, endpoint: IControllerEndpoint<T>) => {
    endpointFunction<T, PM>(this.router.delete, this.provider_map, this.logger, this.auth)(path, endpoint);
  };

  redirect = (path: string, endpoint: IControllerEndpoint<string>) => {
    endpointFunction<string, PM>(
      this.router.get,
      this.provider_map,
      this.logger,
      this.auth,
      HTTP.Moved,
      (res: Response, data: string) => {
        res.status(HTTP.Moved).redirect(data);
      }
    )(path, endpoint);
  };
}

const endpointFunction = <T, K extends ProviderMap>(
  method: IRouterMatcher<AsyncRouterInstance>,
  provider_map: K,
  logger: Logger,
  auth: AuthStrategy,
  resCode?: HTTP,
  lambda?: (res: Response, data: T) => void
) => {
  return (path: string, endpoint: IControllerEndpoint<T>) => {
    method(
      path,
      executeAuthenticationStrategy<K>(Auth.or(auth, endpoint.authStrategy), provider_map),
      endpoint.validators ? validatorMiddleware(endpoint.validators, logger) : (req, res, next) => next(),
      ...(endpoint.preMiddlewares || []),
      (req: Request, res: Response, next: NextFunction) => {
        res.locals.page = Number.parseInt(req.query.page as string) || 0;
        res.locals.per_page = Number.parseInt(req.query.per_page as string) || 10;
        next();
      },
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const returnValue = await endpoint.controller(req, {
            file: req.file,
            pagination: {
              per_page: res.locals.per_page,
              page: res.locals.page
            }
          } as IResLocals);
          lambda ? lambda(res, returnValue) : res.status(resCode || HTTP.OK).json(returnValue);
        } catch (error: unknown) {
          handleError(req, res, next, error as ErrorHandler | Error, logger);
        }
      },
      ...(endpoint.postMiddlewares || [])
    );
  };
};

const executeAuthenticationStrategy = <T extends ProviderMap>(authStrategy: AuthStrategy, pm: T) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [isAuthorised, _, reason] = await authStrategy(req, pm);
      if (!isAuthorised) throw new ErrorHandler(HTTP.Unauthorised, reason);

      return next();
    } catch (error) {
      next(new ErrorHandler(HTTP.Unauthorised, error.message));
    }
  };
};
