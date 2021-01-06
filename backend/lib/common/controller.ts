import { Request, NextFunction, RequestHandler } from 'express-async-router';
import { IResLocals } from '../router';
import { AuthStrategy } from './authorisation';
import { DataClient } from './data';
import Middlewares from './middleware';
import { IFormErrorField } from '@eventi/interfaces';

export interface IControllerEndpoint<T> {
  validators?: Array<(req: Request) => Promise<IFormErrorField[]>>;
  controller: (req: Request, dc:DataClient, locals: IResLocals, next: NextFunction) => Promise<T>;
  preMiddlewares?: RequestHandler[];
  postMiddlewares?: RequestHandler[];
  authStrategy: AuthStrategy;
}

export type BaseArgs = [DataClient, Middlewares, string?];
export class BaseController {
  dc: DataClient;
  mws: Middlewares;
  endpoint:string;

  constructor(providers: DataClient, middlewares: Middlewares, endpoint?:string) {
    this.dc = providers;
    this.mws = middlewares;

    // Unused so far
    this.endpoint = endpoint ?? "";
  }

  get ORM():DataClient["torm"] { return this.dc.torm; }
}
