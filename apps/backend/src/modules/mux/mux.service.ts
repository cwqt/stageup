import {
  AppCache,
  EventBus,
  EVENT_BUS_PROVIDER,
  getCheck,
  LiveStreamAsset,
  Logger,
  LOGGING_PROVIDER,
  ModuleService,
  MuxProvider,
  MUX_PROVIDER,
  PostgresProvider,
  POSTGRES_PROVIDER,
  CACHE_PROVIDER
} from '@core/api';
import { IMUXHookResponse, LiveStreamState, NUUID } from '@core/interfaces';
import Mux from '@mux/mux-node';
import { MD5 } from 'object-hash';
import { RedisClient } from 'redis';
import { Inject, Service } from 'typedi';
import { Connection } from 'typeorm';

@Service()
export class MuxService extends ModuleService {
  constructor(
    @Inject(EVENT_BUS_PROVIDER) private bus: EventBus,
    @Inject(LOGGING_PROVIDER) private log: Logger,
    @Inject(MUX_PROVIDER) private mux: Mux,
    @Inject(POSTGRES_PROVIDER) private pg: Connection,
    @Inject(CACHE_PROVIDER) private cache: AppCache
  ) {
    super();
  }

  async setHookHandled(data: IMUXHookResponse): Promise<void> {
    return new Promise((resolve, reject) => {
      const hookId = `mux:${MD5(data.data)}`;

      this.cache.client
        .multi() // Atomicity
        .hmset(hookId, {
          hookId: data.id,
          objectId: data.object.id,
          type: data.type
        })
        .expire(hookId, 86400) // Expire after 1 day
        .exec(error => {
          if (error) return reject(error);
          return resolve();
        });
    });
  }

  async checkPreviouslyHandledHook(data: IMUXHookResponse): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.cache.client.hmget(`mux:${MD5(data.data)}`, 'hookId', (error, reply) => {
        if (error) return reject(error);
        if (reply[0]) return resolve(true);
        return resolve(false);
      });
    });
  }

  async setLiveStreamAssetState(livestreamAssetId: NUUID, state: LiveStreamState) {
    const stream = await getCheck(LiveStreamAsset.findOne({ _id: livestreamAssetId }));
    stream.meta.state = state;
    await stream.save();

    await this.bus.publish(
      'live_stream.state_changed',
      {
        asset_id: livestreamAssetId,
        state: state
      },
      { language: 'en', region: 'GB' }
    );
  }
}
