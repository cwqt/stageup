import { Access, Router } from './router';
import { Request } from 'express';
import { DataClient } from './common/data';
import {
    IHost,
    IUser,
    IPerformanceStub as IPerfS,
    IPerformance as IPerf,
    IPerformanceHostInfo as IPHInfo, 
    IUserHostInfo} from "@eventi/interfaces";

import Users = require("./controllers/User.controller");
import Hosts = require("./controllers/Host.controller");
import Perfs  = require("./controllers/Performance.controller");
import MUXHooks = require("./controllers/MUXHooks.controller");

/**
 * @description: Create a router, passing in the providers to be accessible to routes
 */
export default (providers:DataClient):Router => {
const router = new Router(providers);

// USERS -----------------------------------------------------------------------------------------------------------------------------------------------------------
router.post   <IUser>       ("/users",                          Users.createUser,                   [Access.None],           Users.validators.createUser);
router.post   <void>        ("/users/logout",                   Users.logoutUser,                   [Access.Authenticated],  null);
router.post   <IUser>       ("/users/login",                    Users.loginUser,                    [Access.None],           Users.validators.loginUser);
router.get    <IUser>       ("/users/@:username",               Users.readUserByUsername,           [],                      Users.validators.readUserByUsername); // order matters
router.get    <IUser>       ("/users/:uid",                     Users.readUserById,                 [Access.Authenticated],  null);
router.put    <IUser>       ("/users/:uid",                     Users.updateUser,                   [Access.Ourself],        null);
router.delete <void>        ("/users/:uid",                     Users.deleteUser,                   [Access.Ourself],        null);
router.get    <IHost>       ("/users/:uid/host",                Users.getUserHost,                  [Access.Authenticated]);
// router.put    <IUser>    ("/users/:uid/avatar",              Users.updateUserAvatar,          [], null);
 
// HOSTS -----------------------------------------------------------------------------------------------------------------------------------------------------------
router.post <IHost>         ("/hosts",                          Hosts.createHost,                   [], null);
router.get  <IUser[]>       ("/hosts/:hid/members",             Hosts.getHostMembers,               [], null);
// router.get  <IUserHostInfo> ("/hosts/:hid/permissions",         Hosts.getUserPermissions,            [], null);

// PERFORMANCES ----------------------------------------------------------------------------------------------------------------------------------------------------
router.post<IPerf>          ("/performances",                   Perfs.createPerformance,            [Access.Authenticated], null);
router.get <IPerfS[]>       ("/performances",                   Perfs.getPerformances,              [Access.Authenticated], null);
router.get <IPerf>          ("/performances/:pid",              Perfs.getPerformance,               [Access.Authenticated], null);
router.get <IPHInfo>        ("/performances/:pid/host_info",    Perfs.getPerformanceHostInfo,       [Access.Authenticated], null);
router.post <void>          ("/performances/:pid/purchase",     Perfs.purchase,                     [Access.Authenticated], null);

// PERFORMANCE PURCHASES -------------------------------------------------------------------------------------------------------------------------------------------

// RATINGS ---------------------------------------------------------------------------------------------------------------------------------------------------------

// MUX HOOKS -------------------------------------------------------------------------------------------------------------------------------------------------------
router.post<void>("/mux/hooks", MUXHooks.handleHook, []);

router.get <string>   ("/ping", async (req:Request) => "Pong!", [], null);
return router;
};