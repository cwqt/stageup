import { Request, NextFunction, RequestHandler } from 'express-async-router';
import { IResLocals } from './router';
import { AuthStrategy } from './authorisation';
import { Middlewares } from './middleware';
import { HTTP, IFormErrorField } from '@core/interfaces';
import { DataClient, DataConnections } from '@core/shared/api';
import { Connection } from 'typeorm';

export interface IControllerEndpoint<T> {
  code?:HTTP;
  validators?: Array<(request: Request) => Promise<IFormErrorField[]>>;
  controller: <K>(request: Request, dc: DataClient<K>, locals: IResLocals, next: NextFunction) => Promise<T>;
  preMiddlewares?: RequestHandler[];
  postMiddlewares?: RequestHandler[];
  authStrategy: AuthStrategy;
}

export type BaseArguments<T=any> = [DataClient<T>, Middlewares, string?];
export class BaseController<T=any> {
  dc: DataClient<T>;
  mws: Middlewares;
  path: string;

  constructor(client: DataClient<T>, middlewares: Middlewares, endpoint?: string) {
    this.dc = client;
    this.mws = middlewares;

    // Unused so far
    this.path = endpoint ?? '';
  }

  get ORM():Connection {
    return this.dc.connections["torm"];
  }
}
