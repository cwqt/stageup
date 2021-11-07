import {
  EventBus,
  EVENT_BUS_PROVIDER,
  IControllerEndpoint,
  Logger,
  LOGGING_PROVIDER,
  MuxProvider,
  MUX_PROVIDER
} from '@core/api';
import { IMUXHookResponse, LiveStreamState, VideoAssetState } from '@core/interfaces';
import { Webhooks } from '@mux/mux-node';
import { Inject, Service } from 'typedi';
import { ModuleController } from '@core/api';

import Env from '../../env';
import { MuxService } from './mux.service';

// simple union to track which MUX event's we're handling
export type HandledMuxEvents =
  | LiveStreamState.Created
  | LiveStreamState.Idle
  | LiveStreamState.Active
  | LiveStreamState.Disconnected
  | LiveStreamState.Completed
  | VideoAssetState.Created
  | VideoAssetState.Ready
  | VideoAssetState.Errored
  | VideoAssetState.Deleted;

@Service()
export class MuxController extends ModuleController {
  readonly webhooks: {
    [index in HandledMuxEvents]: (data: IMUXHookResponse) => Promise<void>;
  };

  constructor(
    private muxService: MuxService,
    @Inject(LOGGING_PROVIDER) private log: Logger,
    @Inject(EVENT_BUS_PROVIDER) private bus: EventBus
  ) {
    super();

    // prettier-ignore
    // proxy webhooks onto event bus
    this.webhooks = {
      [LiveStreamState.Created]:      v => this.bus.publish(`mux.video.live_stream.created`,         v, { language: "en", region: "GB" }),
      [LiveStreamState.Idle]:         v => this.bus.publish(`mux.video.live_stream.idle`,            v, { language: "en", region: "GB" }),
      [LiveStreamState.Active]:       v => this.bus.publish(`mux.video.live_stream.active`,          v, { language: "en", region: "GB" }),
      [LiveStreamState.Disconnected]: v => this.bus.publish(`mux.video.live_stream.disconnected`,    v, { language: "en", region: "GB" }),
      [LiveStreamState.Completed]:    v => this.bus.publish(`mux.video.asset.live_stream_completed`, v, { language: "en", region: "GB" }),
      [VideoAssetState.Created]:      v => this.bus.publish(`mux.video.asset.created`,               v, { language: "en", region: "GB" }),
      [VideoAssetState.Ready]:        v => this.bus.publish(`mux.video.asset.ready`,                 v, { language: "en", region: "GB" }),
      [VideoAssetState.Errored]:      v => this.bus.publish(`mux.video.asset.errored`,               v, { language: "en", region: "GB" }),
      [VideoAssetState.Deleted]:      v => this.bus.publish(`mux.video.asset.deleted`,               v, { language: "en", region: "GB" })
    };
  }

  handleHook: IControllerEndpoint<void> = {
    authorisation: async req => {
      try {
        // https://github.com/muxinc/mux-node-sdk#verifying-webhook-signatures
        const isValidHook = Webhooks.verifyHeader(
          (req as any).rawBody,
          req.headers['mux-signature'] as string,
          Env.MUX.WEBHOOK_SIGNATURE
        );

        if (!isValidHook) return [false, {}, '@@error.invalid'];
      } catch (error) {
        this.log.error(error.message);
        return [false, {}, '@@error.unknown'];
      }

      return [true, {}];
    },
    controller: async req => {
      // Is a valid hook & we should handle it
      const data: IMUXHookResponse = req.body;

      // FUTURE At some point we'll want to add these hooks to a FIFO task queue and just respond with a 200
      // for acknowledged handling, hook then handled by a separate micro-service
      this.log.http(`Received MUX hook: ${data.type}`);

      // Check if hook has already been handled by looking in the Redis store
      if (data.attempts.length > 0 && (await this.muxService.checkPreviouslyHandledHook(req.body))) {
        this.log.info('Duplicate MUX hook');
        return;
      }

      await (this.webhooks[data.type] || this.unsupportedHookHandler.bind(this))(req.body);
      await this.muxService.setHookHandled(req.body);
    }
  };

  async unsupportedHookHandler(data: IMUXHookResponse) {
    this.log.warn(`Un-supported MUX hook: ${data.type}`);
  }
}
