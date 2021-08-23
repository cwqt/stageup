import { HTTP, RequestLocation } from '@core/interfaces';
import { Request, RequestHandler, Response } from 'express-async-router';
import { Struct } from 'superstruct';
import { Connection, getConnection } from 'typeorm';
import { AuthStrategy } from './authorisation';

export interface IControllerEndpoint<ReturnType = any> {
  code?: HTTP;
  validators?: { [index in RequestLocation]?: Struct };
  controller: (request: Request) => Promise<ReturnType>;
  handler?: (res: Response, data: ReturnType) => void;
  middleware?: RequestHandler;
  authorisation: AuthStrategy;
}
