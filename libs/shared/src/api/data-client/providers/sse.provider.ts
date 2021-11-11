import { Provider } from '@core/api';
import { SseEvent, SseEventType } from '@core/interfaces';
import { Hub, ISseMiddlewareOptions, ISseResponse } from '@toverux/expresse';
import { Handler as RequestHandler } from 'express';
import { NextFunction, Request } from 'express-async-router';
import Container, { Service } from 'typedi';
import { LOGGING_PROVIDER } from '../tokens';
import { Logger } from './logging.provider';

export interface SSE {
  create: (id: string) => Hub;
  destroy: (id: string) => void;
  emit: <T>(id: string, event: SseEvent<T>) => void;
  get: (id: string) => Hub;
  middleware: (identifier: (req: Request) => string, options: Partial<ISseMiddlewareOptions>) => RequestHandler;
  getTotalClientCount: () => { [index: string]: number };
}

@Service()
export class SSEHubManagerProvider implements Provider<SSE> {
  name = 'SSE Hub Manager';
  connection;
  config = {};
  log: Logger;
  private hubs: { [index: string]: Hub };

  constructor() {
    this.hubs = {};
    this.log = Container.get(LOGGING_PROVIDER);
  }

  async connect() {
    return this;
  }

  async disconnect() {}

  create(id: string) {
    this.log.debug(`Created Hub: ${id}`);
    this.hubs[id] = new Hub();
    return this.hubs[id];
  }

  destroy(id: string) {
    this.emit(id, { type: SseEventType.Disconnected });
    delete this.hubs[id];
    this.log.debug(`Destroyed hub: ${id}`);
  }

  emit<T>(id: string, event: SseEvent<T>) {
    this.get(id)?.data(event);
  }

  get(id: string) {
    return this.hubs[id];
  }

  /**
   * @description SSE middleware that configures an Express response for an SSE session, installs `sse.*` functions on the Response object
   */
  middleware(id: (req: Request) => string, options: Partial<ISseMiddlewareOptions> = {}): RequestHandler {
    return function middleware(req: Request, res: ISseResponse, next: NextFunction): void {
      const identifier = id(req);

      if (!this.get(identifier)) this.create(identifier);

      const hub = this.get(identifier);

      // Register the SSE functions of that client on the hub
      hub.register(res.sse);

      // Unregister the user from the hub when its connection gets closed (close=client, finish=server)
      res.once('close', () => hub.unregister(res.sse));
      res.once('finish', () => hub.unregister(res.sse));

      next();
    }.bind(this); // ctx bind to class
  }

  getTotalClientCount(): { [index: string]: number } {
    return Object.keys(this.hubs).reduce((acc, curr) => {
      // fuck you for making this private
      acc[curr] = (this.hubs[curr]['clients'] as Set<any>).size;
      return acc;
    }, {});
  }
}
