import { Request } from "express";
import { DataClient } from "../common/data";
import { MUXHook, IMUXHookResponse } from "@eventi/interfaces";
import logger from "../common/logger";
import { Webhooks, LiveStream } from "@mux/mux-node";
import config from "../config";
import { ErrorHandler } from "../common/errors";
import { HTTP } from "@eventi/interfaces";

const streamCreated = async (data:IMUXHookResponse<LiveStream>) => {
    console.log(data)
}

const hookMap: { [index in MUXHook]?: (data:IMUXHookResponse<any>, dc:DataClient) => Promise<void> } = {
    [MUXHook.StreamCreated]: streamCreated,
};

export const handleHook = async (req: Request, dc: DataClient) => {
  try {
    //https://github.com/muxinc/mux-node-sdk#verifying-webhook-signatures
    const isValidHook = Webhooks.verifyHeader(
      JSON.stringify(req.body),
      req.headers["mux-signature"] as string,
      config.MUX.HOOK_SIGNATURE
    );

    if (!isValidHook) throw new ErrorHandler(HTTP.BadRequest, "Invalid MUX hook");
  } catch (error) {
    throw new ErrorHandler(HTTP.BadRequest, error.message);
  }

  // TODO: use redis to track previously recieved hooks so we don't re-handle some
  // requests - MUX doesn't fire & forget

  logger.http(`Received MUX hook: ${req.body.type}`);
  await (hookMap[req.body.type as MUXHook] || unsupportedHookHandler)(req.body, dc);
};

export const unsupportedHookHandler = async (data:IMUXHookResponse<any>, dc:DataClient) => {
  logger.http(`Un-supported MUX hook: ${data.type}`);
};


