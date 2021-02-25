import { RedisClient } from 'redis';
import { MD5 } from 'object-hash';
import { MUXHook, IMUXHookResponse, ErrCode, HTTP } from '@core/interfaces';
import { AuthStrategy, ErrorHandler, DataConnections, BaseArguments, IControllerEndpoint, BaseController } from '@core/shared/api';
import { Webhooks, LiveStream } from '@mux/mux-node';

import Env from '../env';
import { log } from '../common/logger';
import { BackendDataClient } from '../common/data';
import Auth from '../common/authorisation';

export default class MUXHooksController extends BaseController {
  readonly hookMap: {
    [index in MUXHook]?: (data: IMUXHookResponse, dc: DataConnections<BackendDataClient>) => Promise<void>;
  };

  constructor(...args: BaseArguments) {
    super(...args);
    this.hookMap = {
      [MUXHook.StreamCreated]: this.streamCreated
    };
  }

  async streamCreated(data: IMUXHookResponse<LiveStream>) {
    console.log(data);
  }

  validHookStrat():AuthStrategy {
    return async req => {
      try {
        // https://github.com/muxinc/mux-node-sdk#verifying-webhook-signatures
        const isValidHook = Webhooks.verifyHeader(
          JSON.stringify(req.body),
          req.headers['mux-signature'] as string,
          Env.MUX.HOOK_SIGNATURE
        );

        if (!isValidHook) {
          return [false, {}, ErrCode.INVALID];
        }
      } catch (error) {
        log.error(error.message);
        return [false, {}, ErrCode.UNKNOWN];
      }

      return [true, {}];
    };
  }

  handleHook(): IControllerEndpoint<void> {
    return {
      authStrategy: Auth.none, //this.validHookStrat(),
      controller: async req => {
        if (Env.STORE.USE_MEMORYSTORE == true) {
          log.error('Cannot handle MUX hook as Redis is disabled in .env');
        }

        // Is a valid hook & we should handle it
        const data: IMUXHookResponse = req.body;

        // TODO: At some point we'll want to add these hooks to a FIFO task queue and just respond with a 200
        // for acknowledged handling, hook then handled by a separate micro-service
        log.http(`Received MUX hook: ${data.type}`);

        try {
          // Check if hook has already been handled by looking in the Redis store
          if (
            data.attempts.length > 0 &&
            (await this.checkPreviouslyHandledHook(req.body, this.dc.connections.redis))
          ) {
            log.info('Duplicate MUX hook');
            return;
          }

          await (this.hookMap[data.type] || this.unsupportedHookHandler)(req.body, this.dc.connections);
          await this.setHookHandled(req.body, this.dc.connections.redis);
        } catch (error) {
          throw new ErrorHandler(HTTP.ServerError, error);
        }
      }
    };
  }

  setHookHandled = async (data: IMUXHookResponse, redis: RedisClient): Promise<void> => {
    return new Promise((resolve, reject) => {
      const hookId = `hook:${MD5(data.data)}`;

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
      redis.hmget(`hook:${MD5(data.data)}`, 'hookId', (error, reply) => {
        if (error) return reject(error);
        if (reply[0]) return resolve(true);
        return resolve(false);
      });
    });
  };

  async unsupportedHookHandler(data: IMUXHookResponse) {
    log.http(`Un-supported MUX hook: ${data.type}`);
  }
}
