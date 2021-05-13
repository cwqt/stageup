import Auth from '@backend/common/authorisation';
import { AsyncRouter, Providers } from '@core/api';
import { LiveStreamState, SseEventType } from '@core/interfaces';
import { ISseResponse } from '@toverux/expresse';
import { Event } from 'libs/shared/src/api/event-bus/contracts';
import { Logger } from 'winston';
import { Module } from '..';
import { HubManager } from './hub-mananger';

export class SSEModule implements Module {
  name = 'SSE';
  hubs: HubManager;
  log: Logger;
  router: AsyncRouter<any>;

  constructor(logger: Logger) {
    this.log = logger;
    this.hubs = new HubManager(this.log);
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
      if (!this.hubs.get(ct.performance_id)) {
        this.log.debug(`No clients on this instance for pid ${ct.performance_id}`);
      }

      // Submit the event to all connected clients on the hub
      this.hubs.emit(ct.performance_id, { type: SseEventType.StreamStateChanged, data: ct.state });

      // Handle transmitting the state to all clients & closing the hub if stream complete
      if (ct.state == LiveStreamState.Completed) this.hubs.destroy(ct.performance_id);

      this.log.debug('Active hubs: %o', this.hubs.getTotalClientCount());
    });

    this.router = new AsyncRouter({}, Auth.none, this.log, providers.i18n);
    this.router.raw<void>('/performances/:pid', {
      authorisation: Auth.none,
      middleware: this.hubs.dynamicSseHub(),
      // Handler keeps connection alive - up until the client destroys the connection or we end it
      handler: (res: ISseResponse) => res.sse.data({ type: SseEventType.Connected }),
      controller: async _ => {}
    });

    return this.router.router;
  }
}
