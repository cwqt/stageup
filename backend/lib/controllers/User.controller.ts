import { HostPermission, IEnvelopedData, IHost, IHostStub, IUser, IUserHostInfo, IMyself } from "@eventi/interfaces";
import { Request } from "express";
import { body, param } from "express-validator";
import { ErrorHandler, FormErrorResponse } from "../common/errors";
import { HTTP } from "../common/http";
import { DataClient } from "../common/data";
import { validate } from "../common/validate";
import bcrypt from "bcrypt";

import { User } from "../models/User.model";
import Email = require("../common/email");
import { Host } from "../models/Host.model";
import { UserHostInfo } from "../models/UserHostInfo.model";

export const validators = {
  loginUser: validate([
    body("email_address")
      .not()
      .isEmpty()
      .withMessage("Must provide an e-mail address")
      .isEmail()
      .normalizeEmail()
      .withMessage("Not a valid e-mail address"),
    body("password").not().isEmpty().isLength({ min: 6 }).withMessage("Password length must be > 6 characters"),
  ]),
  createUser: validate([
    body("username").not().isEmpty().trim().withMessage("Username cannot be empty"),
    body("email_address").isEmail().normalizeEmail().withMessage("Not a valid email address"),
    body("password").not().isEmpty().isLength({ min: 6 }).withMessage("Password length must be > 6 characters"),
  ]),
  readUserByUsername: validate([param("username").trim().not().isEmpty()]),
};

export const getMyself = async (req:Request):Promise<IMyself> => {
  const u = await User.findOne({ _id: req.session.user._id }, { relations: ["host"] });
  if (!u) throw new ErrorHandler(HTTP.NotFound, "No such user exists");

  let host_info:IUserHostInfo;
  if(u.host) {
    host_info = await UserHostInfo.findOne({ relations: ["user", "host"],
      where: {
        user: {
          _id: u._id,
        },
        host: {
          _id: u.host._id
        }
      }
    });
  }

  return {
    user: u.toFull(),
    host: u.host?.toStub(),
    host_info: host_info
  };
}

export const createUser = async (req: Request, dc: DataClient): Promise<IUser> => {
  const preExistingUser = await User.findOne({ where: [
    { email_address: req.body.email_address },
    { username: req.body.username }
  ]});

  if(preExistingUser) {
    const errors = new FormErrorResponse();
    if(preExistingUser.username == req.body.username) errors.push("username", "Username is already taken", req.body.username);
    if(preExistingUser.email_address == req.body.email_address) errors.push("email_address", "Email is already in use", req.body.email_address);
    throw new ErrorHandler(HTTP.Conflict, errors.value);
  }

  const emailSent = await Email.sendVerificationEmail(req.body.email_address);
  if (!emailSent) throw new ErrorHandler(HTTP.ServerError, "Verification email could not be sent");

  const u = new User({
      username: req.body.username,
      email_address: req.body.email_address,
      password: req.body.password
    }
  );

  return (await dc.torm.manager.save(u)).toFull();
};

export const loginUser = async (req: Request): Promise<IUser> => {
  const emailAddress = req.body.email_address;
  const password = req.body.password;

  const u: User = await User.findOne({ email_address: emailAddress });
  if (!u) throw new ErrorHandler(HTTP.NotFound, "No such user exists");

  if (!u.is_verified)
    throw new ErrorHandler(HTTP.Unauthorised, [{ param: "form", msg: "Your account has not been verified" }]);

  const match = await bcrypt.compare(password, u.pw_hash);
  if (!match) throw new ErrorHandler(HTTP.Unauthorised, [{ param: "password", msg: "Incorrect password" }]);

  req.session.user = {
    _id: u._id,
    is_admin: u.is_admin || false,
  };

  return u.toFull();
};

export const logoutUser = async (req: Request): Promise<void> => {
  req.session.destroy((err) => {
    if (err) throw new ErrorHandler(HTTP.ServerError, "Logging out failed");
    return;
  });
};

export const readUserByUsername = async (req: Request): Promise<IUser> => {
  const u:User = await User.findOne({ username: req.params.username });
  if(!u) throw new ErrorHandler(HTTP.NotFound, "No such user exists");

  return u.toFull() as IUser;
};

export const readUserById = async (req: Request): Promise<IUser> => {
  let u: User = (await User.find({ _id: parseInt(req.params.uid) }))[0];
  if (!u) throw new ErrorHandler(HTTP.NotFound, "No such user exists");

  return u.toFull();
};

export const updateUser = async (req: Request): Promise<IUser> => {
  let u: User = (await User.find({ _id: parseInt(req.params.uid) }))[0];
  if (!u) throw new ErrorHandler(HTTP.NotFound, "No such user exists");

  u = await u.update({ name: req.body.name });
  return u.toFull();
};

export const updateUserAvatar = async (req: Request): Promise<IUser> => {
  return {} as IUser;
};

export const deleteUser = async (req: Request): Promise<void> => {
  let u: User = (await User.find({ _id: parseInt(req.params.uid) }))[0];
  if (!u) throw new ErrorHandler(HTTP.NotFound, "No such user exists");
  await u.remove();
  return;
};


export const getUserHost = async (req:Request):Promise<IEnvelopedData<IHost, IUserHostInfo>> => {
  const user = await User
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.host", "host")
    .getOne();

  if(!user.host) throw new ErrorHandler(HTTP.NotFound, "User is not part of any host");

  const host = await Host.findOne({ _id: user.host._id });

  return {
    data: host.toFull(),
    __client_data: {
      permissions: HostPermission.Admin,
      joined_at: 0
    }
  }
}