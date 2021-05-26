import Auth from '@backend/common/authorisation';
import { AsyncRouter, IControllerEndpoint, Providers } from '@core/api';
import { LiveStreamState, SseEventType } from '@core/interfaces';
import { ISseResponse } from '@toverux/expresse';
import { Event } from 'libs/shared/src/api/event-bus/contracts';
import { Logger } from 'winston';
import { Module } from '..';
import { HubManager } from './hub-mananger';

export class SSEModule implements Module {
  name = 'SSE';
  hubManager: HubManager;
  log: Logger;
  routes: {
    performanceStateSSE: IControllerEndpoint;
  };

  constructor(logger: Logger) {
    this.log = logger;
    this.hubManager = new HubManager(this.log);
  }

  async register(
    bus: InstanceType<typeof Providers.EventBus>,
    providers: {
      i18n: InstanceType<typeof Providers.i18n>;
      email: InstanceType<typeof Providers.Email>;
      orm: InstanceType<typeof Providers.Postgres>;
    }
  ) {
    this.log.info(`Registering module ${this.name}...`);

    bus.subscribe('live_stream.state_changed', ct => {
      // No connected clients on this instance
      if (!this.hubManager.get(ct.asset_id)) {
        this.log.debug(`No clients on this instance for pid ${ct.asset_id}`);
      }

      // Submit the event to all connected clients on the hub
      this.hubManager.emit(ct.asset_id, { type: SseEventType.StreamStateChanged, data: ct.state });

      // Handle transmitting the state to all clients & closing the hub if stream complete
      if (ct.state == LiveStreamState.Completed) this.hubManager.destroy(ct.asset_id);

      this.log.debug('Active hubs: %o', this.hubManager.getTotalClientCount());
    });

    this.routes = {
      performanceStateSSE: {
        authorisation: Auth.none,
        middleware: this.hubManager.dynamicSseHub(),
        // Handler keeps connection alive - up until the client destroys the connection or we end it
        handler: (res: ISseResponse) => res.sse.data({ type: SseEventType.Connected }),
        controller: async _ => {}
      }
    };

    return this;
  }
}
