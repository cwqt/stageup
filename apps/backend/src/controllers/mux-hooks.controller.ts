import { Request } from 'express';
import { DataClient } from '../common/data';
import { MUXHook, IMUXHookResponse, ErrCode, HTTP } from '@eventi/interfaces';
import logger from '../common/logger';
import { Webhooks, LiveStream } from '@mux/mux-node';
import config from '../config';
import { ErrorHandler } from '../common/errors';

import { RedisClient } from 'redis';
import { MD5 } from 'object-hash';
import { AuthStrategy } from '../common/authorisation';
import { BaseArguments, IControllerEndpoint, BaseController } from '../common/controller';

export default class MUXHooksController extends BaseController {
  readonly hookMap: { [index in MUXHook]?: (data: IMUXHookResponse<any>, dc: DataClient) => Promise<void> };

  constructor(...args: BaseArguments) {
    super(...args);
    this.hookMap = {
      [MUXHook.StreamCreated]: this.streamCreated
    };
  }

  async streamCreated(data: IMUXHookResponse<LiveStream>) {
    console.log(data);
  }

  validHookStrat(): AuthStrategy {
    return async req => {
      try {
        // https://github.com/muxinc/mux-node-sdk#verifying-webhook-signatures
        const isValidHook = Webhooks.verifyHeader(
          JSON.stringify(req.body),
          req.headers['mux-signature'] as string,
          config.MUX.HOOK_SIGNATURE
        );

        if (!isValidHook) {
          return [false, {}, ErrCode.INVALID];
        }
      } catch (error) {
        logger.error(error.message);
        return [false, {}, ErrCode.UNKNOWN];
      }

      return [true, {}];
    };
  }

  handleHook(): IControllerEndpoint<void> {
    return {
      authStrategy: this.validHookStrat(),
      controller: async req => {
        if (!config.USE_MEMORYSTORE) {
          logger.error('Cannot handle MUX hook as Redis is disabled in .env');
        }

        // Is a valid hook & we should handle it
        const data: IMUXHookResponse<any> = req.body;

        // TODO: At some point we'll want to add these hooks to a FIFO task queue and just respond with a 200
        // for acknowledged handling, hook then handled by a separate micro-service
        logger.http(`Received MUX hook: ${data.type}`);

        try {
          // Check if hook has already been handled by looking in the Redis store
          if (data.attempts.length > 0 && (await this.checkPreviouslyHandledHook(req.body, this.dc.redis))) {
            logger.info('Duplicate MUX hook');
            return;
          }

          await (this.hookMap[data.type] || this.unsupportedHookHandler)(req.body, this.dc);
          await this.setHookHandled(req.body, this.dc.redis);
        } catch (error) {
          throw new ErrorHandler(HTTP.ServerError, error);
        }
      }
    };
  }

  setHookHandled = async (data: IMUXHookResponse<any>, redis: RedisClient): Promise<void> => {
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
        .exec((error, reply) => {
          if (error) return reject(error);
          return resolve();
        });
    });
  };

  checkPreviouslyHandledHook = async (data: IMUXHookResponse<any>, redis: RedisClient): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      redis.hmget(`hook:${MD5(data.data)}`, 'hookId', (error, reply) => {
        if (error) return reject(error);
        if (reply[0]) return resolve(true);
        return resolve(false);
      });
    });
  };

  async unsupportedHookHandler(data: IMUXHookResponse<any>) {
    logger.http(`Un-supported MUX hook: ${data.type}`);
  }
}
