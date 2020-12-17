import { Request } from 'express';
import { DataClient } from '../common/data';
import { MUXHook, IMUXHookResponse } from '@eventi/interfaces';
import logger from '../common/logger';
import { Webhooks, LiveStream } from '@mux/mux-node';
import config from '../config';
import { ErrorHandler } from '../common/errors';
import { HTTP } from '@eventi/interfaces';
import { RedisClient } from 'redis';
import { MD5 } from 'object-hash';
import { AuthStrategy } from '../authorisation';
import { BaseArgs, IControllerEndpoint, BaseController } from '../common/controller';
export default class MUXHooksController extends BaseController {
  hookMap: { [index in MUXHook]?: (data: IMUXHookResponse<any>, dc: DataClient) => Promise<void> };

  constructor(...args: BaseArgs) {
    super(...args);
    this.hookMap = {
      [MUXHook.StreamCreated]: this.streamCreated,
    };
  }

  async streamCreated(data: IMUXHookResponse<LiveStream>) {
    console.log(data);
  }

  validHookStrat(): AuthStrategy {
    return async (req: Request): Promise<[boolean, {}, string?]> => {
      try {
        //https://github.com/muxinc/mux-node-sdk#verifying-webhook-signatures
        const isValidHook = Webhooks.verifyHeader(
          JSON.stringify(req.body),
          req.headers['mux-signature'] as string,
          config.MUX.HOOK_SIGNATURE
        );

        if (!isValidHook) return [false, {}, 'Invalid MUX hook signature'];
      } catch (error) {
        return [false, {}, error.message];
      }

      return [true, {}];
    };
  }

  handleHook(): IControllerEndpoint<void> {
    return {
      authStrategies: [this.validHookStrat()],
      controller: async (req: Request) => {
        // Is a valid hook & we should handle it
        const data: IMUXHookResponse<any> = req.body;

        // TODO: At some point we'll want to add these hooks to a FIFO task queue and just respond with a 200
        // for acknowledged handling, hook then handled by a separate micro-service
        logger.http(`Received MUX hook: ${data.type}`);

        try {
          // Check if hook has already been handled by looking in the Redis store
          if (data.attempts.length > 0) {
            if (await this.checkPreviouslyHandledHook(req.body, this.dc.redis)) {
              logger.info(`Duplicate MUX hook`);
              return;
            }
          }

          await (this.hookMap[data.type] || this.unsupportedHookHandler)(req.body, this.dc);
          await this.setHookHandled(req.body, this.dc.redis);
        } catch (error) {
          throw new ErrorHandler(HTTP.ServerError, error);
        }
      },
    };
  }

  setHookHandled = async (data: IMUXHookResponse<any>, redis: RedisClient): Promise<void> => {
    return new Promise((res, rej) => {
      const hookId = `hook:${MD5(data.data)}`;

      redis
        .multi() //atomicity
        .hmset(hookId, {
          hookId: data.id,
          objectId: data.object.id,
          type: data.type,
        })
        .expire(hookId, 86400) //expire after 1 day
        .exec((err, reply) => {
          if (err) return rej(err);
          res();
        });
    });
  };

  checkPreviouslyHandledHook = async (data: IMUXHookResponse<any>, redis: RedisClient): Promise<boolean> => {
    return new Promise((res, rej) => {
      redis.hmget(`hook:${MD5(data.data)}`, 'hookId', (err, reply) => {
        if (err) return rej(err);
        if (reply[0]) return res(true);
        return res(false);
      });
    });
  };

  async unsupportedHookHandler(data: IMUXHookResponse<any>) {
    logger.http(`Un-supported MUX hook: ${data.type}`);
  }
}
