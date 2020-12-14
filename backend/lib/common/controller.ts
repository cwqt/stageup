import { Request, NextFunction, RequestHandler } from 'express-async-router';
import { IResLocals } from '../router';
import { AuthStrategy } from '../authorisation';
import { DataClient } from './data';
import Middlewares from './middleware';

export interface IControllerEndpoint<T> {
  validator: any;
  controller: (req: Request, dc:DataClient, locals: IResLocals, next: NextFunction) => Promise<T>;
  preMiddlewares: RequestHandler[];
  postMiddlewares: RequestHandler[];
  authStrategies: AuthStrategy[];
}

export type BaseArgs = [DataClient, Middlewares];
export class BaseController {
  dc: DataClient;
  mws: Middlewares;

  constructor(providers: DataClient, middlewares: Middlewares) {
    this.dc = providers;
    this.mws = middlewares;
  }
}
