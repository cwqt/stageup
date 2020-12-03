import { IHost, IPerformance, IPerformanceHostInfo, IPerformanceStub, IUser } from "@eventi/interfaces";
import { Request } from "express";
import { User } from "../models/User.model";
import { DataClient } from "../common/data";
import { Performance } from "../models/Performance.model";
import { Host } from "../models/Host.model";
import { ErrorHandler } from "../common/errors";
import { HTTP } from "../common/http";
import { validate } from "../common/validate";
import { body } from "express-validator";
import { PerformanceHostInfo } from '../models/PerformanceHostInfo.model';

export const validators = {
  createPerformance: validate([body("name").not().isEmpty().withMessage("Performance must have a title!")]),
};

export const createPerformance = async (req: Request, dc: DataClient): Promise<IPerformance> => {
  const user = await User
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.host", "host")
    .getOne();

  if (!user.host) throw new ErrorHandler(HTTP.BadRequest, "You're not authorised to create performances.");

  const performance = await(new Performance({
      name: req.body.name,
      description: req.body.description ?? "",
      price: req.body.price,
      currency: req.body.currency
    },
    user
  )).setup(dc);

  return performance.toFull();
};

export const getPerformances = async (req: Request): Promise<IPerformanceStub[]> => {
  const performances = await Performance.find({ take: 10 });
  return performances.map((p: Performance) => p.toStub());
};


export const getPerformanceHostInfo = async (req:Request):Promise<IPerformanceHostInfo> => {
    return {} as IPerformanceHostInfo;
}