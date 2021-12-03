import {
  EventBus,
  EVENT_BUS_PROVIDER,
  Logger,
  LOGGING_PROVIDER,
  SSEHubManagerProvider,
  SSE_HUB_PROVIDER,
  Contract,
  SSE
} from '@core/api';
import { LiveStreamState, SseEventType } from '@core/interfaces';
import { Inject, Service } from 'typedi';
import { ModuleEvents } from '@core/api';

@Service()
export class SSEEvents extends ModuleEvents {
  constructor(
    @Inject(EVENT_BUS_PROVIDER) private bus: EventBus,
    @Inject(LOGGING_PROVIDER) private log: Logger,
    @Inject(SSE_HUB_PROVIDER) private sse: SSE
  ) {
    super();
    this.events = {
      'live_stream.state_changed': this.fanOutStreamStateChangeToActiveViews
    };
  }

  async fanOutStreamStateChangeToActiveViews(ct: Contract<'live_stream.state_changed'>) {
    // No connected clients on this instance
    if (!this.sse.get(ct.asset_id)) {
      this.log.debug(`No clients on this instance for pid ${ct.asset_id}`);
    }

    // Submit the event to all connected clients on the hub
    this.sse.emit(ct.asset_id, { type: SseEventType.StreamStateChanged, data: ct.state });

    // Handle transmitting the state to all clients & closing the hub if stream complete
    if (ct.state == LiveStreamState.Completed) this.sse.destroy(ct.asset_id);

    this.log.debug('Active hubs: %o', this.sse.getTotalClientCount());
  }
}
