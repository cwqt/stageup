import { IResLocals, Router } from './router';
import { Request } from 'express';
import { IUser, NodeType } from "@eventi/interfaces";
import { DataClient } from './common/data';

import Users = require("./controllers/User.controller");

/**
 * @description: Create a router, passing in the providers to be accessible to routes
 */
export default (providers:DataClient):Router => {
const router = new Router(providers);

// USERS -----------------------------------------------------------------------------------------------------------------------------------------------------------
router.post   <IUser> ("/users",             Users.createUser,         [], Users.validators.createUser);
router.post   <void>  ("/users/logout",      Users.logoutUser,         [], null);
router.post   <IUser> ("/users/login",       Users.loginUser,          [], Users.validators.loginUser);
router.get    <IUser> ("/users/:uid",        Users.readUserById,       [], null);
router.put    <IUser> ("/users/:uid",        Users.updateUser,         [], null);
router.delete <void>  ("/users/:uid",        Users.deleteUser,         [], null);
// router.get    <IUser> ("/u/:username",       Users.readUserByUsername, [], Users.validators.readUserByUsername);
// router.put    <IUser> ("/users/:uid/avatar", Users.updateUserAvatar,   [], null);


router.get <string>   ("/ping", async (req:Request) => "Pong!", [], null);

return router;
};