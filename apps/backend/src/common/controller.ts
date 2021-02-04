import { Request, NextFunction, RequestHandler } from 'express-async-router';
import { IResLocals } from '../router';
import { AuthStrategy } from './authorisation';
import { DataClient } from './data';
import Middlewares from './middleware';
import { IFormErrorField } from '@core/interfaces';

export interface IControllerEndpoint<T> {
  validators?: Array<(request: Request) => Promise<IFormErrorField[]>>;
  controller: (request: Request, dc: DataClient, locals: IResLocals, next: NextFunction) => Promise<T>;
  preMiddlewares?: RequestHandler[];
  postMiddlewares?: RequestHandler[];
  authStrategy: AuthStrategy;
}

export type BaseArguments = [DataClient, Middlewares, string?];
export class BaseController {
  dc: DataClient;
  mws: Middlewares;
  path: string;

  constructor(providers: DataClient, middlewares: Middlewares, endpoint?: string) {
    this.dc = providers;
    this.mws = middlewares;

    // Unused so far
    this.path = endpoint ?? '';
  }

  get ORM(): DataClient['torm'] {
    return this.dc.torm;
  }
}
