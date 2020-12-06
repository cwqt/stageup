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
import { PerformanceHostInfo } from "../models/PerformanceHostInfo.model";
import { String } from "aws-sdk/clients/cloudsearch";

export const validators = {
  createPerformance: validate([body("name").not().isEmpty().withMessage("Performance must have a title!")]),
};

export const createPerformance = async (req: Request, dc: DataClient): Promise<IPerformance> => {
  const user = await User
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.host", "host")
    .getOne();

  if (!user.host) throw new ErrorHandler(HTTP.BadRequest, "You're not authorised to create performances.");

  const performance = await new Performance({
      name: req.body.name,
      description: req.body.description ?? "",
      price: req.body.price,
      currency: req.body.currency,
    },
    user
  ).setup(dc);

  return performance.toFull();
};

export const getPerformances = async (req: Request): Promise<IPerformanceStub[]> => {
  const performances = await Performance.find({ take: 10 });
  return performances.map((p: Performance) => p.toStub());
};

export const getPerformance = async (req:Request, dc:DataClient):Promise<IPerformance> => {
  const performance = await Performance.findOne({ _id: parseInt(req.params.pid)});
  return performance;
}

export const getPerformanceHostInfo = async (req: Request, dc:DataClient): Promise<IPerformanceHostInfo> => {  
  const hostInfoId:string | null = (await dc.torm.createQueryBuilder()
      .select("performance.host_info")
      .from(Performance, "performance")
      .whereInIds(req.params.pid)
      .execute() || [])[0]?.hostInfo_id;

  if(!hostInfoId) throw new ErrorHandler(HTTP.BadRequest, "No Host Info for this Performance");

  const performanceHostInfo = await PerformanceHostInfo
      .createQueryBuilder("phi")
      .whereInIds(parseInt(hostInfoId))
      .leftJoinAndSelect("phi.signing_key", "sk")
      .getOne();

  return performanceHostInfo as IPerformanceHostInfo;
};
