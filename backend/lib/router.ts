import { Request, Response, NextFunction, IRouterMatcher } from "express";
import { HTTP } from "./common/http";
import { ErrorHandler, handleError } from "./common/errorHandler";
import logger from "./common/logger";
import Multer from "multer";
import { AsyncRouterInstance } from "express-async-router";
const AsyncRouter = require("express-async-router").AsyncRouter;

export enum Access {
  SiteAdmin,
  OrgAdmin,
  OrgEditor,
  OrgMember,
  Ourself,
  Authenticated,
  None,
}

export interface IResLocals {
  session?: {
    user?: {
      _id: string;
      admin: boolean;
    };
  };
  pagination?: {
    per_page: number;
    page: number;
  };
}

const skip = (req: Request, res: Response, next: NextFunction) => {
  next();
};

const endpointFunc = <T>(method:IRouterMatcher<T>, resCode?:HTTP, lamda?:(res:Response, data:T) => void) => {
  return (
    path: string,
    controller: (req: Request, next: NextFunction, locals: IResLocals, permissions: Access[]) => Promise<T>,
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
          const returnValue = await controller(
            req,
            next,
            {
              file: req.file,
              session: req.session,
              pagination: {
                per_page: res.locals.per_page,
                page: res.locals.page,
              },
            } as IResLocals,
            access
          );
          lamda ? lamda(res, returnValue) : res.status(resCode || HTTP.OK).json(returnValue);
        } catch (err) {
          handleError(req, res, next, err);
        }
      }
    );
  };
}

export class Router {
  router: any;
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

  constructor() {
    this.router = AsyncRouter();
  }

  get = <T>(
    path:string,
    controller:any,
    access:Access[],
    validators: any = skip,
    nodeData?:any) =>
      endpointFunc<T>(this.router.get)
        (path, controller, access, validators);

  put = <T>(
    path:string,
    controller:any,
    access:Access[],
    validators: any = skip,
    nodeData?:any) =>
      endpointFunc<T>(this.router.put)
        (path, controller, access, validators);

  post = <T>(
    path:string,
    controller:any,
    access:Access[],
    validators: any = skip,
    nodeData?:any) =>
      endpointFunc<T>(this.router.post, HTTP.Created)
        (path, controller, access, validators);
    
  delete = <T>(
    path:string,
    controller:any,
    access:Access[],
    validators: any = skip,
    nodeData?:any) =>
      endpointFunc<T>(this.router.delete)
        (path, controller, access, validators);        

  redirect = (
    path:string,
    controller:any,
    access:Access[],
    validators: any = skip,
    nodeData?:any) =>
      endpointFunc<string>(this.router.get, HTTP.Moved,
        (res:Response, data:string) => res.status(HTTP.Moved).redirect(data))
        (path, controller, access, validators);        
      }

const getCheckPermissions = (access: Access[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      //No perms / session required
      if (access.length == 0 || access.includes(Access.None)) return next();

      //All other checks require an active session (logged in)
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
