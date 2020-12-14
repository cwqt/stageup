import Multer from "multer";
import { Request, Response, NextFunction, IRouterMatcher } from "express";
import { ErrorHandler, handleError } from "./common/errors";
import { DataClient } from "./common/data";
import { AuthStrategy } from './authorisation';
import { HTTP } from "@eventi/interfaces";

const AsyncRouter = require("express-async-router").AsyncRouter;

export enum Access {
  SiteAdmin,
  Ourself,
  Authenticated,
  None,
}
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
    controller: (req: Request, dc:DataClient, locals: IResLocals, next: NextFunction) => Promise<T>,
    authStrats: AuthStrategy[],
    validators: any = skip,
    preMiddleware?:any[],
    postMiddleware?:any[]
  ) => {
    method(
      path,
      executeAuthenticationStrategies(authStrats, providers),
      validators ?? skip,
      ...(preMiddleware || []),
      (req: Request, res: Response, next: NextFunction) => {
        res.locals.page = parseInt(req.query.page as string) || 0;
        res.locals.per_page = parseInt(req.query.per_page as string) || 10;
        next();
      },
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const returnValue = await controller(
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
      ...(postMiddleware || []),
    );
  };
}


export class Router {
  router: any;
  providers:DataClient;
  fileParser = Multer({
    storage: Multer.memoryStorage(),
    limits: {
      fileSize: 2 * 1024 * 1024, //no files larger than 2mb
    },
    fileFilter: (req: Request, file: Express.Multer.File, cb: Multer.FileFilterCallback) => {
      // FIXME: file.buffer is undefined
      // FileType.fromBuffer(file.buffer).then((ft) => {
      //   if (ft.mime != file.mimetype)
      //     return cb(new Error(`File mime-type mismatch: ${ft.mime} != ${file.mimetype}`));
      //   if (!["image/png", "image/jpg", "image/jpeg"].includes(ft.mime))
      //     return cb(new Error(`File type not allowed`));
      //   cb(null, true);
      // });
      if (!["image/png", "image/jpg", "image/jpeg"].includes(file.mimetype))
        return cb(new Error(`File type not allowed`));
      cb(null, true);
    },
  });

  constructor(providers:DataClient) {
    this.router = AsyncRouter();
    this.providers = providers;
  }

  get = <T>(
    path:string,
    controller:(req: Request, dc:DataClient, locals: IResLocals, next: NextFunction) => Promise<T>,
    authStrats:AuthStrategy[],
    validators: any = skip,
    preMiddlware?:any[],
    postMiddleware?:any[]) =>
      endpointFunc<T>(this.router.get, this.providers)
        (path, controller, authStrats, validators, preMiddlware, postMiddleware);

  put = <T>(
    path:string,
    controller:(req: Request, dc:DataClient, locals: IResLocals, next: NextFunction) => Promise<T>,
    authStrats:AuthStrategy[],
    validators: any = skip,
    preMiddlware?:any[],
    postMiddleware?:any[]) =>
      endpointFunc<T>(this.router.put, this.providers)
      (path, controller, authStrats, validators, preMiddlware, postMiddleware);

  post = <T>(
    path:string,
    controller:(req: Request, dc:DataClient, locals: IResLocals, next: NextFunction) => Promise<T>,
    authStrats:AuthStrategy[],
    validators: any = skip,
    preMiddlware?:any[],
    postMiddleware?:any[]) =>
      endpointFunc<T>(this.router.post, this.providers, HTTP.Created)
      (path, controller, authStrats, validators, preMiddlware, postMiddleware);
    
  delete = <T>(
    path:string,
    controller:(req: Request, dc:DataClient, locals: IResLocals, next: NextFunction) => Promise<T>,
    authStrats:AuthStrategy[],
    validators: any = skip,
    preMiddlware?:any[],
    postMiddleware?:any[]) =>
      endpointFunc<T>(this.router.delete, this.providers)
      (path, controller, authStrats, validators, preMiddlware, postMiddleware);

  redirect = (
    path:string,
    controller:(req: Request, dc:DataClient, locals: IResLocals, next: NextFunction) => Promise<string>,
    authStrats:AuthStrategy[],
    validators: any = skip,
    preMiddlware?:any[],
    postMiddleware?:any[]) =>
      endpointFunc<string>(this.router.get, this.providers, HTTP.Moved,
        (res:Response, data:string) => res.status(HTTP.Moved).redirect(data))
        (path, controller, authStrats, validators, preMiddlware, postMiddleware);
      }

const executeAuthenticationStrategies = (authStrats: AuthStrategy[], dc:DataClient) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Site admin can do anything
      if (req.session.user?.is_admin) return next();

      // Run all auth strategies
      for(let i=0; i<authStrats.length; i++) {
        let [isAuthorised, _, reason] = await authStrats[i](req, dc);
        if(reason) throw new ErrorHandler(HTTP.Unauthorised, reason);
      }

      return next();
    } catch (error) {
      return next(new ErrorHandler(HTTP.Unauthorised, error.message));
    }
  };
};