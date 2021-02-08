import { Request, Response, NextFunction, IRouterMatcher } from 'express';
import { AsyncRouter } from 'express-async-router';
import { HTTP } from '@core/interfaces';

import { ErrorHandler, handleError } from './common/errors';
import { DataClient } from './common/data';
import { AuthStrategy } from './common/authorisation';
import { IControllerEndpoint } from './common/controller';
import { validatorMiddleware } from './common/validate';

export interface IResLocals {
  pagination?: {
    per_page: number;
    page: number;
  };
}

const endpointFunction = <T>(
  method: IRouterMatcher<T>,
  providers: DataClient,
  resCode?: HTTP,
  lambda?: (res: Response, data: T) => void
) => {
  return (path: string, endpoint: IControllerEndpoint<T>) => {
    method(
      path,
      executeAuthenticationStrategy(endpoint.authStrategy, providers),
      endpoint.validators ? validatorMiddleware(endpoint.validators) : (req, res, next) => next(),
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
            providers,
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
          handleError(req, res, next, error as ErrorHandler | Error);
        }
      },
      ...(endpoint.postMiddlewares || [])
    );
  };
};

export class Router {
  router: any;
  providers: DataClient;

  constructor(providers: DataClient) {
    this.router = AsyncRouter();
    this.providers = providers;
  }

  get = <T>(path: string, endpoint: IControllerEndpoint<T>) => {
    endpointFunction<T>(this.router.get, this.providers)(path, endpoint);
  };

  put = <T>(path: string, endpoint: IControllerEndpoint<T>) => {
    endpointFunction<T>(this.router.put, this.providers)(path, endpoint);
  };

  post = <T>(path: string, endpoint: IControllerEndpoint<T>) => {
    endpointFunction<T>(this.router.post, this.providers)(path, endpoint);
  };

  delete = <T>(path: string, endpoint: IControllerEndpoint<T>) => {
    endpointFunction<T>(this.router.delete, this.providers)(path, endpoint);
  };

  redirect = (path: string, endpoint: IControllerEndpoint<string>) => {
    endpointFunction<string>(this.router.get, this.providers, HTTP.Moved, (res: Response, data: string) => {
      res.status(HTTP.Moved).redirect(data);
    })(path, endpoint);
  };
}

const executeAuthenticationStrategy = (authStrategy: AuthStrategy, dc: DataClient) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Site admin can do anything
      if (req.session?.user?.is_admin) return next();

      const [isAuthorised, _, reason] = await authStrategy(req, dc);
      if (!isAuthorised) throw new ErrorHandler(HTTP.Unauthorised, reason);

      return next();
    } catch (error) {
      next(new ErrorHandler(HTTP.Unauthorised, error.message));
    }
  };
};
