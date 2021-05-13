import { HTTP, RequestLocation } from '@core/interfaces';
import { Request, RequestHandler, Response } from 'express-async-router';
import { Struct } from 'superstruct';
import { Connection } from 'typeorm';
import { AuthStrategy } from './authorisation';
import { ProviderMap } from './data-client';
import { Middlewares } from './middleware';

export interface IControllerEndpoint<ReturnType = any> {
  code?: HTTP;
  validators?: { [index in RequestLocation]?: Struct };
  controller: (request: Request) => Promise<ReturnType>;
  handler?: (res: Response, data: ReturnType) => void;
  middleware?: RequestHandler;
  authorisation: AuthStrategy;
}

export type BaseArguments<T extends ProviderMap> = [T, Middlewares, string?];

export class BaseController<T extends ProviderMap> {
  providers: T;
  middleware: Middlewares;
  path: string;

  constructor(pm: T, middlewares: Middlewares, endpoint?: string) {
    this.providers = pm;
    this.middleware = middlewares;

    // Unused so far
    this.path = endpoint ?? '';
  }

  get ORM(): Connection {
    return this.providers['torm'].connection;
  }
}
