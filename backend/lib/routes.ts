import { Access, Router } from './router';
import { Request } from 'express';
import { DataClient } from './common/data';
import {
    IHost,
    IUser,
    IPerformanceStub as IPerfS,
    IPerformance as IPerf,
    IPerformanceHostInfo as IPHInfo, 
    IUserHostInfo as IUHInfo,
    IPerformancePurchase as IPurchase,
    IEnvelopedData as IE,
    IUserHostInfo,
    IEnvelopedData,
    IPerformanceUserInfo as IPUInfo,
    IMyself
} from "@eventi/interfaces";

import AuthStrat from './authorisation';

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
router.get    <IMyself>             ("/myself",                               Users.readMyself,                   [AuthStrat.isLoggedIn],       null);
router.post   <IUser>               ("/users",                                Users.createUser,                   [AuthStrat.none],             Users.validators.createUser);
router.post   <void>                ("/users/logout",                         Users.logoutUser,                   [AuthStrat.isLoggedIn],       null);
router.post   <IUser>               ("/users/login",                          Users.loginUser,                    [AuthStrat.none],             Users.validators.loginUser);
router.get    <IUser>               ("/users/@:username",                     Users.readUserByUsername,           [AuthStrat.none],             Users.validators.readUserByUsername); // order matters
router.get    <IUser>               ("/users/:uid",                           Users.readUserById,                 [AuthStrat.isLoggedIn],       null);
router.put    <IUser>               ("/users/:uid",                           Users.updateUser,                   [AuthStrat.isOurself],        null);
router.delete <void>                ("/users/:uid",                           Users.deleteUser,                   [AuthStrat.isOurself],        null);
router.get    <IE<IHost, IUHInfo>>  ("/users/:uid/host",                      Users.readUserHost,                 [AuthStrat.isLoggedIn],       null);
router.put    <IUser>               ("/users/:uid/avatar",                    Users.updateUserAvatar,             [AuthStrat.isLoggedIn],       null);
// router.get    <IPurchase[]>         ("/users/:uid/purchases",                 Users.readPurchases,                 [AuthStrat.isLoggedIn],       null);
// router.get    <IUserHostInfo>       ("/hosts/:hid/permissions",               Users.readUserHostPermissions,       [AuthStrat.isLoggedIn],       null);

// HOSTS -----------------------------------------------------------------------------------------------------------------------------------------------------------
router.post   <IHost>               ("/hosts",                                Hosts.createHost,                    [], null);
router.get    <IUser[]>             ("/hosts/:hid/members",                   Hosts.readHostMembers,               [], null);
// router.put    <IHost>               ("/hosts/:hid",                           Hosts.updateHost,                   [], null);
router.delete <void>                ("/hosts/:hid",                           Hosts.deleteHost,                    [], null);
// router.post   <IHost>               ("/hosts/:hid/members",                   Hosts.addUser,                      [], null);
// router.delete <IHost>               ("/hosts/:hid/members",                   Hosts.removeUser,                   [], null);
// router.delete <IHost>               ("/hosts/:hid/members/:mid/permissions",  Hosts.alterMemberPermissions,       [], null);

// PERFORMANCES ----------------------------------------------------------------------------------------------------------------------------------------------------
router.post   <IPerf>               ("/performances",                           Perfs.createPerformance,             [AuthStrat.isLoggedIn], null);
router.get    <IE<IPerfS[], null>>  ("/performances",                           Perfs.readPerformances,              [AuthStrat.isLoggedIn], null);
router.get    <IE<IPerf, IPUInfo>>  ("/performances/:pid",                      Perfs.readPerformance,               [AuthStrat.isLoggedIn], null);
router.get    <IPHInfo>             ("/performances/:pid/host_info",            Perfs.readPerformanceHostInfo,       [AuthStrat.isLoggedIn], null);
router.post   <void>                ("/performances/:pid/purchase",             Perfs.purchase,                      [AuthStrat.isLoggedIn], null);
// router.delete <void>                ("/performance/:pid",                       Perfs.deletePerformance,            [Access.Authenticated])

// PERFORMANCE PURCHASES -------------------------------------------------------------------------------------------------------------------------------------------

// RATINGS ---------------------------------------------------------------------------------------------------------------------------------------------------------

// ASSETS ---------------------------------------------------------------------------------------------------------------------------------------------------------

// MUX HOOKS -------------------------------------------------------------------------------------------------------------------------------------------------------
router.post<void>("/mux/hooks", MUXHooks.handleHook, []);

router.get <string>   ("/ping", async (req:Request) => "Pong!", [], null);
return router;
};