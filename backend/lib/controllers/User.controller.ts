import { IUser } from "@eventi/interfaces";
import { Request } from 'express';
import { body, param } from "express-validator";
import { DataClient } from "../common/data";
import { validate } from "../common/validate";

import { User } from '../models/User.model';

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
      readUserByUsername: validate([param("username").not().isEmpty().trim()]),    
}


export const createUser = async (req:Request, dc:DataClient):Promise<IUser> => {
    let u = new User({
        username: req.body.username,
        email_address: req.body.email_address
    }, req.body.password);

    u.name = "Cass";
    u = await dc.torm.manager.save(u);
    return u as IUser;
}

export const logoutUser = async (req:Request):Promise<void> => {

}

export const loginUser = async (req:Request):Promise<IUser> => {
    return {} as IUser;
}

export const readUserByUsername = async (req:Request):Promise<IUser> => {
    return {} as IUser;
}

export const readUserById = async (req:Request):Promise<IUser> => {
    return {} as IUser;
}

export const updateUser = async (req:Request):Promise<IUser> => {
    return {} as IUser;
}

export const updateUserAvatar = async (req:Request):Promise<IUser> => {
    return {} as IUser;
}

export const deleteUser = async (req:Request):Promise<void> => {

}