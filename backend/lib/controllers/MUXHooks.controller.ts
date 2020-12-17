<<<<<<< HEAD
import { Request } from 'express';
import { DataClient } from '../common/data';
import { MUXHook, IMUXHookResponse } from '@eventi/interfaces';
import logger from '../common/logger';
import { Webhooks, LiveStream } from '@mux/mux-node';
import config from '../config';
import { ErrorHandler } from '../common/errors';
import { HTTP } from '@eventi/interfaces';
import { RedisClient } from 'redis';
import { promisify } from 'util';
import { readUserById } from './User.controller';
import { MD5 } from 'object-hash';

const streamCreated = async (data: IMUXHookResponse<LiveStream>) => {
  console.log(data);
};

const hookMap: { [index in MUXHook]?: (data: IMUXHookResponse<any>, dc: DataClient) => Promise<void> } = {
  [MUXHook.StreamCreated]: streamCreated,
};

export const handleHook = async (req: Request, dc: DataClient) => {
  try {
    //https://github.com/muxinc/mux-node-sdk#verifying-webhook-signatures
    const isValidHook = Webhooks.verifyHeader(
      JSON.stringify(req.body),
      req.headers['mux-signature'] as string,
      config.MUX.HOOK_SIGNATURE
    );

    if (!isValidHook) throw new ErrorHandler(HTTP.BadRequest, 'Invalid MUX hook');
  } catch (error) {
    throw new ErrorHandler(HTTP.BadRequest, error.message);
  }

  // Is a valid hook & we should handle it
  const data: IMUXHookResponse<any> = req.body;

  // TODO: At some point we'll want to add these hooks to a FIFO task queue and just respond with a 200
  // for acknowledged handling, hook then handled by a separate micro-service
  logger.http(`Received MUX hook: ${data.type}`);

  try {
    // Check if hook has already been handled by looking in the Redis store
    if (data.attempts.length > 0) {
      if (await checkPreviouslyHandledHook(req.body, dc.redis)) {
        logger.info(`Duplicate MUX hook`);
        return;
      }
    }

    await (hookMap[data.type] || unsupportedHookHandler)(req.body, dc);
    await setHookHandled(req.body, dc.redis);
  } catch (error) {
    throw new ErrorHandler(HTTP.ServerError, error);
  }
};

export const setHookHandled = async (data: IMUXHookResponse<any>, redis: RedisClient): Promise<void> => {
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
=======
import { Request } from "express";
import { DataClient } from "../common/data";
import { MUXHook, IMUXHookResponse } from "@eventi/interfaces";
import logger from "../common/logger";
import { Webhooks, LiveStream } from "@mux/mux-node";
import config from "../config";
import { BaseArgs, BaseController, IControllerEndpoint } from "../common/controller";
import { AuthStrategy } from '../authorisation';

export default class MUXHooksController extends BaseController {
  hookMap: { [index in MUXHook]?: (data:IMUXHookResponse<any>, dc:DataClient) => Promise<void> }

  constructor(...args: BaseArgs) {
    super(...args);
    this.hookMap = {
      [MUXHook.StreamCreated]: this.streamCreated,
    };
  }

  async streamCreated(data:IMUXHookResponse<LiveStream>) {
    console.log(data)
  }

  validHookStrat():AuthStrategy {
    return async (req:Request):Promise<[boolean, {}, string?]> => {
      try {
        //https://github.com/muxinc/mux-node-sdk#verifying-webhook-signatures
        const isValidHook = Webhooks.verifyHeader(
          JSON.stringify(req.body),
          req.headers["mux-signature"] as string,
          config.MUX.HOOK_SIGNATURE
        );
    
        if(!isValidHook) return [false, {}, "Invalid MUX hook signature"];
      } catch (error) {
        return [false, {}, error.message];
      }
    
      return [true, {}];
    }
  }

  handleHook():IControllerEndpoint<void> {
    return {
      authStrategies: [this.validHookStrat()],
      controller: async (req:Request) => {
        // TODO: use redis to track previously recieved hooks so we don't re-handle some
        // requests - MUX doesn't fire & forget

        logger.http(`Received MUX hook: ${req.body.type}`);
        await (this.hookMap[req.body.type as MUXHook] || this.unsupportedHookHandler)(req.body, this.dc);
      }
    }
  }

  async unsupportedHookHandler(data:IMUXHookResponse<any>) {
    logger.http(`Un-supported MUX hook: ${data.type}`);
  }
}
>>>>>>> 18e18a39d8ae23ea5db33758a52c865eb91f6a21

export const checkPreviouslyHandledHook = async (data: IMUXHookResponse<any>, redis: RedisClient): Promise<boolean> => {
  return new Promise((res, rej) => {
    redis.hmget(`hook:${MD5(data.data)}`, 'hookId', (err, reply) => {
      if (err) return rej(err);
      if (reply[0]) return res(true);
      return res(false);
    });
  });
};

export const unsupportedHookHandler = async (data: IMUXHookResponse<any>, dc: DataClient) => {
  logger.http(`Un-supported MUX hook: ${data.type}`);
};
