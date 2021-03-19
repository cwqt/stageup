import { Request, NextFunction, RequestHandler } from 'express-async-router';
import { IResLocals } from './router';
import { AuthStrategy } from './authorisation';
import { Middlewares } from './middleware';
import { HTTP, IFormErrorField } from '@core/interfaces';
import { Connection } from 'typeorm';
import { ProviderMap } from './data-client';

export interface IControllerEndpoint<T> {
  code?: HTTP;
  validators?: Array<(request: Request) => Promise<IFormErrorField[]>>;
  controller: (request: Request, locals: IResLocals) => Promise<T>;
  preMiddlewares?: RequestHandler[];
  postMiddlewares?: RequestHandler[];
  authStrategy: AuthStrategy;
}

export type BaseArguments<T extends ProviderMap> = [T, Middlewares, string?];

export class BaseController<T extends ProviderMap> {
  providers: T;
  mws: Middlewares;
  path: string;

  constructor(pm: T, middlewares: Middlewares, endpoint?: string) {
    this.providers = pm;
    this.mws = middlewares;

    // Unused so far
    this.path = endpoint ?? '';
  }

  get ORM(): Connection {
    return this.providers['torm'].connection;
  }
}
