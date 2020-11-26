import { IUser } from "@eventi/interfaces";
import { Request } from 'express';
import { body, param } from "express-validator";
import { validate } from "../common/validate";

export const validators = {
    loginUser: validate([
        body("email")
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
        body("email").isEmail().normalizeEmail().withMessage("Not a valid email address"),
        body("password").not().isEmpty().isLength({ min: 6 }).withMessage("Password length must be > 6 characters"),
      ]),
      readUserByUsername: validate([param("username").not().isEmpty().trim()]),    
}


export const createUser = async (req:Request):Promise<IUser> => {}

export const logoutUser = async (req:Request):Promise<void> => {}

export const loginUser = async (req:Request):Promise<IUser> => {}

export const readUserByUsername = async (req:Request):Promise<IUser> => {}

export const readUserById = async (req:Request):Promise<IUser> => {}

export const updateUser = async (req:Request):Promise<IUser> => {}

export const updateUserAvatar = async (req:Request):Promise<IUser> => {}

export const deleteUser = async (req:Request):Promise<void> => {}