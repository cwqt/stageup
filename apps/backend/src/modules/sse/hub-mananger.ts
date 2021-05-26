import { SseEvent, SseEventType } from '@core/interfaces';
import { Hub, ISseMiddlewareOptions, ISseResponse } from '@toverux/expresse';
import { Handler } from 'express';
import { NextFunction, Request } from 'express-async-router';
import { Logger } from 'winston';

export class HubManager {
  private log: Logger;
  private hubs: { [index: string]: Hub };

  constructor(log: Logger) {
    this.log = log;
    this.hubs = {};
  }

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
  dynamicSseHub(options: Partial<ISseMiddlewareOptions> = {}): Handler {
    return function middleware(req: Request, res: ISseResponse, next: NextFunction): void {
      if (!this.get(req.params.aid)) this.create(req.params.aid);

      const hub = this.get(req.params.aid);

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
      acc[curr] = (this.hubs[curr]['clients'] as Set<any>).size;
      return acc;
    }, {});
  }
}
