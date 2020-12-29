import { Request, Response, NextFunction, IRouterMatcher } from "express";
import { ErrorHandler, handleError } from "./common/errors";
import { DataClient } from "./common/data";
import { AuthStrategy } from './authorisation';
import { HTTP } from "@eventi/interfaces";
import { IControllerEndpoint } from "./common/controller";
import { validatorMiddleware } from "./common/validate";

const AsyncRouter = require("express-async-router").AsyncRouter;

export interface IResLocals {
  pagination?: {
    per_page: number;
    page: number;
  };
}

const skip = (req: Request, res: Response, next: NextFunction) => next();

const endpointFunc = <T>(method:IRouterMatcher<T>, providers:DataClient, resCode?:HTTP, lambda?:(res:Response, data:T) => void) => {
  return (
    path: string,
    endpoint:IControllerEndpoint<T>
  ) => {
    method(
      path,
      executeAuthenticationStrategy(endpoint.authStrategy, providers),
      endpoint.validators ? validatorMiddleware(endpoint.validators) : skip,
      ...(endpoint.preMiddlewares || []),
      (req: Request, res: Response, next: NextFunction) => {
        res.locals.page = parseInt(req.query.page as string) || 0;
        res.locals.per_page = parseInt(req.query.per_page as string) || 10;
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
                page: res.locals.page,
              },
            } as IResLocals,
            next
          );
          lambda ? lambda(res, returnValue) : res.status(resCode || HTTP.OK).json(returnValue);
        } catch (err) {
          handleError(req, res, next, err);
        }
      },
      ...(endpoint.postMiddlewares || []),
    );
  };
}


export class Router {
  router: any;
  providers:DataClient;

  constructor(providers:DataClient) {
    this.router = AsyncRouter();
    this.providers = providers;
  }

  get = <T>(
    path:string,
    endpoint:IControllerEndpoint<T>) =>
      endpointFunc<T>(this.router.get, this.providers)(path, endpoint);

  put = <T>(
    path:string,
    endpoint:IControllerEndpoint<T>) =>
      endpointFunc<T>(this.router.put, this.providers)(path, endpoint);


  post = <T>(
    path:string,
    endpoint:IControllerEndpoint<T>) =>
      endpointFunc<T>(this.router.post, this.providers)(path, endpoint);

  delete = <T>(
    path:string,
    endpoint:IControllerEndpoint<T>) =>
      endpointFunc<T>(this.router.delete, this.providers)(path, endpoint);


  redirect = (
    path:string,
    endpoint:IControllerEndpoint<string>) =>
      endpointFunc<string>(this.router.get, this.providers, HTTP.Moved,
        (res:Response, data:string) => res.status(HTTP.Moved).redirect(data))
        (path, endpoint);
      }

const executeAuthenticationStrategy = (authStrategy: AuthStrategy, dc:DataClient) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Site admin can do anything
      if (req.session?.user?.is_admin) return next();

      const [isAuthorised, _, reason] = await authStrategy(req, dc);
      if(!isAuthorised) throw new ErrorHandler(HTTP.Unauthorised, reason);
      
      return next();
    } catch (error) {
      return next(new ErrorHandler(HTTP.Unauthorised, error.message));
    }
  };
};