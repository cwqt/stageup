import { IHost, IPerformance, IPerformanceStub, IUser } from "@eventi/interfaces";
import { Request } from "express";
import { User } from "../models/User.model";
import { DataClient } from "../common/data";
import { Performance } from "../models/Performance.model";
import { Host } from '../models/Host.model';
import { ErrorHandler } from "../common/errors";
import { HTTP } from '../common/http'

export const createPerformance = async (req: Request, dc: DataClient): Promise<IPerformance> => {
  const user = await User.findOne({ _id: req.session.user._id });
  if(!user.host) throw new ErrorHandler(HTTP.BadRequest, "You're not authorised to create performances.")

  const users_host = await Host.findOne({ _id: user.host._id });
  if(!users_host) throw new ErrorHandler(HTTP.ServerError);

  const performance = new Performance({
      name: req.body.name,
      description: req.body.description ?? ""
    }, user, users_host
  );

  await dc.torm.manager.save(performance);
  return performance.toFull();
};

export const getPerformances = async (req:Request):Promise<IPerformanceStub[]> => {
    const performances = await Performance.find({ take: 10 });
    return performances.map((p:Performance) => p.toStub());
}