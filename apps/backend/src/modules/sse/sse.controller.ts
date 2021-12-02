import { Auth, EventBus, EVENT_BUS_PROVIDER, IControllerEndpoint, SSEHubManagerProvider, SSE_HUB_PROVIDER } from '@core/api';
import { SseEventType } from '@core/interfaces';
import { ISseResponse } from '@toverux/expresse';
import { Inject, Service } from 'typedi';
import { ModuleController } from '@core/api';

@Service()
export class SSEController extends ModuleController {
  constructor(
    @Inject(SSE_HUB_PROVIDER) private sse: SSEHubManagerProvider,
    @Inject(EVENT_BUS_PROVIDER) private bus: EventBus
  ) {
    super();
  }

  performanceStateEvents: IControllerEndpoint<void> = {
    authorisation: Auth.none,
    middleware: this.sse.middleware(req => req.params.aid),
    // Handler keeps connection alive - up until the client destroys the connection or we end it
    controller: async req => {
      // this.bus.publish('live_stream.hub_created', { asset_id: req.params.aid }, req.locale);
    },
    handler: (res: ISseResponse) => {
      return res.sse.data({ type: SseEventType.Connected });
    }
  };
}
