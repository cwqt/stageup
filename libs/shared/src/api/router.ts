import { Request, Response, NextFunction } from 'express';
import { IRouterMatcher } from 'express-serve-static-core';
import { AsyncRouter as ExpressAsyncRouter, AsyncRouterInstance, RequestHandler } from 'express-async-router';
import { HTTP } from '@core/interfaces';

import { Auth, ErrorHandler, handleError } from '@core/shared/api';
import { AuthStrategy } from './authorisation';
import { DataClient, DataConnections, IControllerEndpoint } from '@core/shared/api';
import { validatorMiddleware } from './validate';
import { Logger } from 'winston';
import { IMiddlewareConnections, Middlewares } from './middleware';

export default <T>(client:DataClient<T>, auth:AuthStrategy, middlewares:IMiddlewareConnections, logger:Logger) => {
  const router = new AsyncRouter(client, auth, logger)
  const mws = new Middlewares(middlewares);

  return (f:(router:AsyncRouter, client:DataClient<T>, mws:Middlewares) => void):AsyncRouter<T> => {
    f(router, client, mws);
    return router;
  }
}

export interface IResLocals {
  pagination?: {
    per_page: number;
    page: number;
  };
}

export class AsyncRouter<K=any> {
  router: AsyncRouterInstance;
  client: DataClient<K>;
  auth: AuthStrategy;
  logger: Logger;

  constructor(client: DataClient<K>, auth:AuthStrategy, logger: Logger) {
    this.router = ExpressAsyncRouter();
    this.client = client;
    this.auth = auth;
    this.logger = logger;
  }

  get = <T>(path: string, endpoint: IControllerEndpoint<T>) => {
    endpointFunction<T, K>(this.router.get, this.client, this.logger, this.auth)(path, endpoint);
  };

  put = <T>(path: string, endpoint: IControllerEndpoint<T>) => {
    endpointFunction<T, K>(this.router.put, this.client, this.logger, this.auth)(path, endpoint);
  };

  post = <T>(path: string, endpoint: IControllerEndpoint<T>) => {
    endpointFunction<T, K>(this.router.post, this.client, this.logger, this.auth)(path, endpoint);
  };

  delete = <T>(path: string, endpoint: IControllerEndpoint<T>) => {
    endpointFunction<T, K>(this.router.delete, this.client, this.logger, this.auth)(path, endpoint);
  };

  redirect = (path: string, endpoint: IControllerEndpoint<string>) => {
    endpointFunction<string, K>(
      this.router.get,
      this.client,
      this.logger,
      this.auth,
      HTTP.Moved,
      (res: Response, data: string) => {
        res.status(HTTP.Moved).redirect(data);
      }
    )(path, endpoint);
  };
}

const endpointFunction = <T, K>(
  method: IRouterMatcher<AsyncRouterInstance, 'get' | 'post' | 'put' | 'delete'>,
  client: DataClient<K>,
  logger: Logger,
  auth: AuthStrategy,
  resCode?: HTTP,
  lambda?: (res: Response, data: T) => void
) => {
  return (path: string, endpoint: IControllerEndpoint<T>) => {
    method(
      path,
      executeAuthenticationStrategy<K>(Auth.or(auth, endpoint.authStrategy), client.connections),
      endpoint.validators ? validatorMiddleware(endpoint.validators, logger) : (req, res, next) => next(),
      ...(endpoint.preMiddlewares || []),
      (req: Request, res: Response, next: NextFunction) => {
        res.locals.page = Number.parseInt(req.query.page as string) || 0;
        res.locals.per_page = Number.parseInt(req.query.per_page as string) || 10;
        next();
      },
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const returnValue = await endpoint.controller(
            req,
            client,
            {
              file: req.file,
              pagination: {
                per_page: res.locals.per_page,
                page: res.locals.page
              }
            } as IResLocals,
            next
          );
          lambda ? lambda(res, returnValue) : res.status(resCode || HTTP.OK).json(returnValue);
        } catch (error: unknown) {
          handleError(req, res, next, error as ErrorHandler | Error, logger);
        }
      },
      ...(endpoint.postMiddlewares || [])
    );
  };
};

const executeAuthenticationStrategy = <T>(authStrategy:AuthStrategy, dc:DataConnections<T>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [isAuthorised, _, reason] = await authStrategy(req, dc);
      if (!isAuthorised) throw new ErrorHandler(HTTP.Unauthorised, reason);

      return next();
    } catch (error) {
      next(new ErrorHandler(HTTP.Unauthorised, error.message));
    }
  };
};
