import { ErrCode, IMUXHookResponse, LiveStreamState, MuxHook } from '@core/interfaces';
import {
  Performance,
  Asset,
  BaseArguments,
  BaseController,
  getCheck,
  IControllerEndpoint,
  TopicType
} from '@core/shared/api';
import { timeout } from "@core/shared/helpers"
import { LiveStream, Webhooks } from '@mux/mux-node';
import { MD5 } from 'object-hash';
import { RedisClient } from 'redis';
import { BackendProviderMap } from '..';
import { log } from '../common/logger';
import Env from '../env';

export default class MUXController extends BaseController<BackendProviderMap> {
  readonly hookMap: {
    [index in MuxHook]?: (data: IMUXHookResponse, pm: BackendProviderMap) => Promise<void>;
  };

  constructor(...args: BaseArguments<BackendProviderMap>) {
    super(...args);
    this.hookMap = {
      [LiveStreamState.Created]: this.streamCreated.bind(this),
      [LiveStreamState.Idle]: this.streamIdle.bind(this),
      [LiveStreamState.Active]: this.streamActive.bind(this),
      [LiveStreamState.Disconnected]: this.streamDisconnected.bind(this),
      [LiveStreamState.Completed]: this.streamCompleted.bind(this)
    };
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

        await (this.hookMap[data.type] || this.unsupportedHookHandler)(req.body, this.providers);
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
