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


