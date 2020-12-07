import { HostPermission, IHost, IUser, IUserHostInfo } from "@eventi/interfaces";
import { Request } from "express";
import { User } from "../models/User.model";
import { DataClient } from "../common/data";
import { Host } from "../models/Host.model";
import { ErrorHandler } from "../common/errors";
import { HTTP } from "../common/http";
import { UserHostInfo } from '../models/UserHostInfo.model';
import { validate } from "../common/validate";
import { query } from 'express-validator';


export const validators = {
  getUserHostInfo: validate([query("user").trim().not().isEmpty().toInt()]),
};

export const createHost = async (req: Request, dc: DataClient): Promise<IHost> => {
  const user = await User.findOne({ _id: req.session.user._id }, { relations: ["host"] });
  if(user.host) throw new ErrorHandler(HTTP.Conflict, "Cannot create host if already part of another");

  const host = new Host({
      username: req.body.username,
      name: req.body.name
    }
  );

  // addMember saves to db
  await host.addMember(user, HostPermission.Owner, dc);
  return host.toFull();
};

export const getHostMembers = async (req:Request):Promise<IUser[]> => {
    const host = await Host.findOne({ _id: parseInt(req.params.hid) });
    return host.members.map((u:User) => u.toFull());
}

export const getUserHostInfo = async (req:Request):Promise<IUserHostInfo> => {
  const uhi = await UserHostInfo.findOne({ relations: ["host", "user"],
    where: {
      user: {
        _id: parseInt(req.query.user as string)
      },
      host: {
        _id: parseInt(req.params.hid)
      }
    },
  });

  return uhi;
}

export const deleteHost = async (req:Request):Promise<void> => {
  const user = await User.findOne({ _id: req.session.user._id }, { relations: ["host"] });
  if(!user.host)
    throw new ErrorHandler(HTTP.NotFound, "User is not part of any host");

  const userHostInfo = await UserHostInfo.findOne({ relations: ["user", "host"],
    where: {
      user: { _id: user._id },
      host: { _id: user.host._id }
    }
  });

  if(userHostInfo.permissions != HostPermission.Owner)
    throw new ErrorHandler(HTTP.Unauthorised, "Only host owner can delete host");

  await user.host.remove();
}