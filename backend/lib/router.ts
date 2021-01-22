import { Request, Response, NextFunction, IRouterMatcher } from 'express';
import { ErrorHandler, handleError } from './common/errors';
import { DataClient } from './common/data';
import { AuthStrategy } from './common/authorisation';
import { HTTP } from '@eventi/interfaces';
import { IControllerEndpoint } from './common/controller';
import { validatorMiddleware } from './common/validate';

const AsyncRouter = require('express-async-router').AsyncRouter;

export interface IResLocals {
  pagination?: {
    per_page: number;
    page: number;
  };
}

const skip = (request: Request, res: Response, next: NextFunction) => {
  next();
};

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
      endpoint.validators ? validatorMiddleware(endpoint.validators) : skip,
      ...(endpoint.preMiddlewares || []),
      (request: Request, res: Response, next: NextFunction) => {
        res.locals.page = Number.parseInt(request.query.page as string) || 0;
        res.locals.per_page = Number.parseInt(request.query.per_page as string) || 10;
        next();
      },
      async (request: Request, res: Response, next: NextFunction) => {
        try {
          const returnValue = await endpoint.controller(
            request,
            providers,
            {
              file: request.file,
              pagination: {
                per_page: res.locals.per_page,
                page: res.locals.page
              }
            } as IResLocals,
            next
          );
          lambda ? lambda(res, returnValue) : res.status(resCode || HTTP.OK).json(returnValue);
        } catch (error) {
          handleError(request, res, next, error);
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
  return async (request: Request, res: Response, next: NextFunction) => {
    try {
      // Site admin can do anything
      if (request.session?.user?.is_admin) {
        next();
        return;
      }

      const [isAuthorised, _, reason] = await authStrategy(request, dc);
      if (!isAuthorised) {
        throw new ErrorHandler(HTTP.Unauthorised, reason);
      }

      next();
      return;
    } catch (error) {
      next(new ErrorHandler(HTTP.Unauthorised, error.message));
    }
  };
};
