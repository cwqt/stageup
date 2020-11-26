import { Request, Response }  from 'express';
import { Router } from './router';
import {
    IUser
} from "@eventi/interfaces";

import Users       = require("./controllers/User.controller");


const router = new Router();

// USERS -----------------------------------------------------------------------------------------------------------------------------------------------------------
router.post   <IUser> ("/users",             Users.createUser,         [], Users.validators.createUser);
router.post   <void>  ("/users/logout",      Users.logoutUser,         [], null);
router.post   <IUser> ("/users/login",       Users.loginUser,          [], Users.validators.loginUser);
router.get    <IUser> ("/u/:username",       Users.readUserByUsername, [], Users.validators.readUserByUsername);
router.get    <IUser> ("/users/:uid",        Users.readUserById,       [], null);
router.put    <IUser> ("/users/:uid",        Users.updateUser,         [], null);
router.put    <IUser> ("/users/:uid/avatar", Users.updateUserAvatar,   [], null);
router.delete <void>  ("/users/:uid",        Users.deleteUser,         [], null);



export default router;