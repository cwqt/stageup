import { Request, Response, NextFunction, IRouterMatcher } from "express";
import { HTTP } from "./common/http";
import { ErrorHandler, handleError } from "./common/errors";
import logger from "./common/logger";
import Multer from "multer";
import { DataClient } from "./common/data";
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

// if user has a session, this will be returned alongside the reponse
export interface IClientData<T> {
  __client_data:T;
}

const destruct = async (f:Function, ...args:any[]):Promise<[any, any?]> => {
  let res = await f(...args);
  res = Array.isArray(res) ? res : [res, null];  
  return res;
}

const clientDataHandler = async <T,K={}>(controller:any, ...args:any[]):Promise<(T & IClientData<K>)> => {
  const [res, client_data]:[any,any?] = await destruct(controller, args);
  return {
    ...(<T><unknown>res),
    ...(<IClientData<K>><unknown>{__client_data: client_data})};
}

// clientDataHandler<IHostStub, IUserHostInfo>();
// type x = IHostStub & IClientData<IUserHostInfo>;
// let y = {} as x;
// y.__client_data.permissions

const skip = (req: Request, res: Response, next: NextFunction) => next();

const endpointFunc = <T,K>(
  method: IRouterMatcher<T>,
  providers: DataClient,
  resCode?: HTTP,
  lambda?: (res: Response, data: T) => void
) => {
  return (
    path: string,
    controller: (
      req: Request,
      dc: DataClient,
      locals: IResLocals,
      next: NextFunction,
      permissions: Access[]
    ) => Promise<T | [T, K]>,
    access: Access[],
    validators: any = skip
  ) => {
    method(
      path,
      getCheckPermissions(access),
      validators ?? skip,
      (req: Request, res: Response, next: NextFunction) => {
        res.locals.page = parseInt(req.query.page as string) || 0;
        res.locals.per_page = parseInt(req.query.per_page as string) || 10;
        next();
      },
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const returnValue = await (clientDataHandler<T,K>(controller,
            req,
            providers,
            {
              file: req.file,
              pagination: {
                per_page: res.locals.per_page,
                page: res.locals.page,
              },
            } as IResLocals,
            next,
            access
          ));
          lambda ? lambda(res, returnValue) : res.status(resCode || HTTP.OK).json(returnValue);
        } catch (err) {
          handleError(req, res, next, err);
        }
      }
    );
  };
};


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

  get = <T, K={}>(
    path:string,
    controller:(req: Request, dc:DataClient, locals: IResLocals, next: NextFunction, permissions: Access[]) => Promise<T | [T,K]>,
    access:Access[],
    validators: any = skip) =>
      endpointFunc<T,K>(this.router.get, this.providers)
        (path, controller, access, validators);

  put = <T, K={}>(
    path:string,
    controller:(req: Request, dc:DataClient, locals: IResLocals, next: NextFunction, permissions: Access[]) => Promise<T |[T,K]>,
    access:Access[],
    validators: any = skip) =>
      endpointFunc<T,K>(this.router.put, this.providers)
        (path, controller, access, validators);

  post = <T,K={}>(
    path:string,
    controller:(req: Request, dc:DataClient, locals: IResLocals, next: NextFunction, permissions: Access[]) => Promise<T |[T,K]>,
    access:Access[],
    validators: any = skip) =>
      endpointFunc<T,K>(this.router.post, this.providers, HTTP.Created)
        (path, controller, access, validators);
    
  delete = <T,K={}>(
    path:string,
    controller:(req: Request, dc:DataClient, locals: IResLocals, next: NextFunction, permissions: Access[]) => Promise<T |[T,K]>,
    access:Access[],
    validators: any = skip) =>
      endpointFunc<T,K>(this.router.delete, this.providers)
        (path, controller, access, validators);        

  redirect = (
    path:string,
    controller:(req: Request, dc:DataClient, locals: IResLocals, next: NextFunction, permissions: Access[]) => Promise<string>,
    access:Access[],
    validators: any = skip) =>
      endpointFunc<string, void>(this.router.get,this.providers,  HTTP.Moved,
        (res:Response, data:string) => res.status(HTTP.Moved).redirect(data))
        (path, controller, access, validators);        
      }

const getCheckPermissions = (access: Access[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    //TODO: sort out authorisation / authentication
    try {
      return next();
      //No perms / session required
      // if (access.length == 0 || access.includes(Access.None)) return next();

      // All other checks require an active session (logged in)
      // if (!req.session?.user!) throw new Error(`Session required to access requested resource`);

      //Site admin can do anything
      // if (req.session.user!.admin) return next();

      logger.error("Auth dead end.");
      throw new ErrorHandler(HTTP.BadRequest, "Invalid auth")
    } catch (error) {
      return next(new ErrorHandler(HTTP.Unauthorised, error.message));
    }
  };
};