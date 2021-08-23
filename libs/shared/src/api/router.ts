import { Auth, ErrorHandler, handleError, IControllerEndpoint } from '@core/api';
import { HTTP } from '@core/interfaces';
import { NextFunction, Request, Response } from 'express';
import { AsyncRouter as ExpressAsyncRouter, AsyncRouterInstance } from 'express-async-router';
import { IRouterMatcher } from 'express-serve-static-core';
import { Middleware } from 'express-validator/src/base';
import { AuthStrategy } from './authorisation';
import Validator from './validation';

export type Routes = (router) => void;

export class AsyncRouter {
  router: AsyncRouterInstance;
  auth: AuthStrategy;

  constructor(auth: AuthStrategy) {
    this.router = ExpressAsyncRouter();
    this.auth = auth;
  }

  register(routes: Routes) {
    routes(this);
    return this.router;
  }

  use = (path: string, router: Middleware) => {
    this.router.use(path, router);
  };

  get = <T>(path: string, endpoint: IControllerEndpoint<T>) => {
    this.endpoint<T>(this.router.get)(path, endpoint);
  };

  put = <T>(path: string, endpoint: IControllerEndpoint<T>) => {
    this.endpoint<T>(this.router.put)(path, endpoint);
  };

  post = <T>(path: string, endpoint: IControllerEndpoint<T>) => {
    this.endpoint<T>(this.router.post, HTTP.Created)(path, endpoint);
  };

  delete = <T>(path: string, endpoint: IControllerEndpoint<T>) => {
    this.endpoint<T>(this.router.delete)(path, endpoint);
  };

  raw = <T>(path: string, endpoint: IControllerEndpoint<T>) => {
    this.endpoint<T>(this.router.get, HTTP.OK, endpoint.handler)(path, endpoint);
  };

  redirect = (path: string, endpoint: IControllerEndpoint<string>) => {
    this.endpoint<string>(this.router.get, HTTP.Moved, (res: Response, data: string) => {
      res.status(HTTP.Moved).redirect(data);
    })(path, endpoint);
  };

  private endpoint = <T>(
    method: IRouterMatcher<AsyncRouterInstance>,
    responseCode?: HTTP,
    lambda?: (res: Response, data: T) => void
  ) => {
    return (path: string, endpoint: IControllerEndpoint<T>) => {
      method(
        path,
        this.executeAuthenticationStrategy(Auth.or(this.auth, endpoint.authorisation)),
        endpoint.validators ? Validator.Middleware(endpoint.validators) : (_, __, next) => next(),
        endpoint.middleware ? endpoint.middleware : (_, __, next) => next(),
        async (req: Request, res: Response, next: NextFunction) => {
          try {
            const returnValue = await endpoint.controller(req);
            lambda ? lambda(res, returnValue) : res.status(responseCode || HTTP.OK).json(returnValue);
          } catch (error) {
            handleError(req, res, next, error as ErrorHandler | Error);
          }
        }
      );
    };
  };

  private executeAuthenticationStrategy = (authStrategy: AuthStrategy) => {
    return async (req: Request, _: Response, next: NextFunction) => {
      try {
        const [isAuthorised, _, reason] = await authStrategy(req);
        if (!isAuthorised) throw new ErrorHandler(HTTP.Unauthorised, reason);
        return next();
      } catch (error) {
        next(new ErrorHandler(HTTP.Unauthorised, error.message));
      }
    };
  };
}
