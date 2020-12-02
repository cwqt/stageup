import { IHost, IUser } from "@eventi/interfaces";
import { Request } from "express";
import { User } from "../models/User.model";
import { DataClient } from "../common/data";
import { Host } from "../models/Host.model";

export const createHost = async (req: Request, dc: DataClient): Promise<IHost> => {
  const host = new Host({
      username: req.body.username,
      name: req.body.name,
    },
    await User.findOne({ _id: req.session.user._id })
  );

  await dc.torm.manager.save(host);
  return host.toFull();
};

export const getHostMembers = async (req:Request):Promise<IUser[]> => {
    const host = await Host.findOne({ _id: parseInt(req.params.hid) });
    return host.members.map((u:User) => u.toFull());
}