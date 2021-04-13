import {
  AssetType,
  ErrCode,
  IMUXHookResponse,
  IMuxPassthrough,
  LiveStreamState,
  MuxHook,
  VideoAssetState
} from '@core/interfaces';
import {
  Performance,
  Asset,
  BaseArguments,
  BaseController,
  getCheck,
  IControllerEndpoint,
  TopicType,
  AssetGroup
} from '@core/shared/api';
import { timeout } from '@core/shared/helpers';
import { LiveStream, Webhooks } from '@mux/mux-node';
import { MD5 } from 'object-hash';
import { RedisClient } from 'redis';
import { BackendProviderMap } from '..';
import { log } from '../common/logger';
import Env from '../env';

import { Asset as MuxAsset } from '@mux/mux-node';

export default class MUXController extends BaseController<BackendProviderMap> {
  readonly hookMap: {
    [index in MuxHook]?: (data: IMUXHookResponse) => Promise<void>;
  };

  constructor(...args: BaseArguments<BackendProviderMap>) {
    super(...args);
    this.hookMap = {
      [LiveStreamState.Created]: this.streamCreated.bind(this),
      [LiveStreamState.Idle]: this.streamIdle.bind(this),
      [LiveStreamState.Active]: this.streamActive.bind(this),
      [LiveStreamState.Disconnected]: this.streamDisconnected.bind(this),
      [LiveStreamState.Completed]: this.streamCompleted.bind(this),
      [VideoAssetState.Created]: this.videoAssetCreated.bind(this),
      [VideoAssetState.Ready]: this.videoAssetReady.bind(this),
      [VideoAssetState.Errored]: this.videoAssetErrored.bind(this),
      [VideoAssetState.Deleted]: this.videoAssetDeleted.bind(this)
    };
  }

  async videoAssetCreated(data: IMUXHookResponse<MuxAsset>) {
    // Set the asset identifier to the Asset & not the Direct Upload, now that we have it
    const passthrough: IMuxPassthrough = JSON.parse(data.data.passthrough);

    console.log(passthrough);
    const asset = await getCheck(Asset.findOne({ _id: passthrough.asset_id }));
    asset.asset_identifier = data.object.id;
    await asset.save();
  }

  async videoAssetReady(data: IMUXHookResponse<MuxAsset>) {
    const passthrough: IMuxPassthrough = JSON.parse(data.data.passthrough);
    const asset = await getCheck(
      Asset.findOne<Asset<AssetType.Video>>({ _id: passthrough.asset_id })
    );

    // Now we have a playback Id & can set the source location on the asset
    const assetInfo = await this.providers.mux.connection.Video.Assets.get(asset.asset_identifier);
    asset.meta.playback_id = assetInfo.playback_ids.find(p => p.policy == 'public').id;
    asset.location = asset.getLocation();
    await asset.save();

    // delete all other videos but this one (not that there should be more than 1), since this is the latest video
    const group = await AssetGroup.findOne({ _id: passthrough.asset_group_id });
    await Promise.all(
      group.assets
        .filter(a => a.type == AssetType.Video && a._id !== passthrough.asset_id)
        .map(a => a.delete(this.providers.mux)) // deletes both Asset & Mux Asset
    );
  }

  async videoAssetErrored(data: IMUXHookResponse<MuxAsset>) {
    const passthrough: IMuxPassthrough = JSON.parse(data.data.passthrough);
    const asset = await getCheck(
      Asset.findOne<Asset<AssetType.Video>>({ _id: passthrough.asset_id })
    );
    await asset.remove();
  }

  async videoAssetDeleted(data: IMUXHookResponse<MuxAsset>) {
  }

  async setPerformanceState(objectId: string, state: LiveStreamState) {
    const performance = await getCheck(
      Performance.findOne({
        where: {
          stream: {
            asset_identifier: objectId
          }
        },
        select: {
          _id: true,
          stream: {
            _id: true,
            asset_identifier: true
          }
        }
      })
    );

    log.debug(`MUX --> found ${performance._id} ${objectId} ${state}`);
    await this.providers.pubsub.publish(TopicType.StreamStateChanged, {
      performance_id: performance._id,
      state: state
    });
  }

  async streamCreated(data: IMUXHookResponse<LiveStream>) {
    // FIXME: race condition occurs where the live stream is created in the Performance.setup()
    // but the performance isn't actually saved in the database at this point because
    // the transaction hasn't completed, so put a timeout of 500ms
    // we'll need to revisit this at some point...
    await timeout(500);
    await this.setPerformanceState(data.object.id, LiveStreamState.Idle);
  }

  async streamIdle(data: IMUXHookResponse<LiveStream>) {
    await this.setPerformanceState(data.object.id, LiveStreamState.Idle);
  }

  async streamActive(data: IMUXHookResponse<LiveStream>) {
    await this.setPerformanceState(data.object.id, LiveStreamState.Active);
  }

  async streamDisconnected(data: IMUXHookResponse<LiveStream>) {
    await this.setPerformanceState(data.object.id, LiveStreamState.Disconnected);
  }

  async streamCompleted(data: IMUXHookResponse<LiveStream>) {
    await this.setPerformanceState(data.object.id, LiveStreamState.Completed);
  }

  handleHook(): IControllerEndpoint<void> {
    return {
      authStrategy: async req => {
        try {
          // https://github.com/muxinc/mux-node-sdk#verifying-webhook-signatures
          const isValidHook = Webhooks.verifyHeader(
            (req as any).rawBody,
            req.headers['mux-signature'] as string,
            Env.MUX.HOOK_SIGNATURE
          );

          if (!isValidHook) return [false, {}, ErrCode.INVALID];
        } catch (error) {
          log.error(error.message);
          return [false, {}, ErrCode.UNKNOWN];
        }

        return [true, {}];
      },
      controller: async req => {
        if (Env.STORE.USE_MEMORYSTORE == true) {
          log.error('Cannot handle MUX hook as Redis is disabled in .env');
        }

        // Is a valid hook & we should handle it
        const data: IMUXHookResponse = req.body;

        // TODO: At some point we'll want to add these hooks to a FIFO task queue and just respond with a 200
        // for acknowledged handling, hook then handled by a separate micro-service
        log.http(`Received MUX hook: ${data.type}`);

        // Check if hook has already been handled by looking in the Redis store
        if (
          data.attempts.length > 0 &&
          (await this.checkPreviouslyHandledHook(req.body, this.providers.redis.connection))
        ) {
          log.info('Duplicate MUX hook');
          return;
        }

        await (this.hookMap[data.type] || this.unsupportedHookHandler)(req.body);
        await this.setHookHandled(req.body, this.providers.redis.connection);
      }
    };
  }

  setHookHandled = async (data: IMUXHookResponse, redis: RedisClient): Promise<void> => {
    return new Promise((resolve, reject) => {
      const hookId = `mux:${MD5(data.data)}`;

      redis
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
  };

  checkPreviouslyHandledHook = async (data: IMUXHookResponse, redis: RedisClient): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      redis.hmget(`mux:${MD5(data.data)}`, 'hookId', (error, reply) => {
        if (error) return reject(error);
        if (reply[0]) return resolve(true);
        return resolve(false);
      });
    });
  };

  async unsupportedHookHandler(data: IMUXHookResponse) {
    log.warn(`Un-supported MUX hook: ${data.type}`);
  }
}
