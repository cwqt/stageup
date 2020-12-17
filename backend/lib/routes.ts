import { Request } from 'express';
import { Router } from './router';
import { DataClient } from './common/data';
import Middlewares from './common/middleware';

import {
    IHost,
    IUser,
    IPerformanceStub as IPerfS,
    IPerformance as IPerf,
    IPerformanceHostInfo as IPHInfo, 
    IUserHostInfo as IUHInfo,
    IPerformancePurchase as IPurchase,
    IEnvelopedData as IE,
    IPerformanceUserInfo as IPUInfo,
    IMyself,
} from "@eventi/interfaces";

import UserController from './controllers/User.controller';
import HostController from './controllers/Host.controller';
import PerfController from './controllers/Performance.controller';
import MUXHooksController from './controllers/MUXHooks.controller';
import AuthController from './controllers/Auth.controller';
import authorisation from './authorisation';

/**
 * @description: Create a router, passing in the providers to be accessible to routes
 */
export default (providers:DataClient):Router => {
const router = new Router(providers);
const mws = new Middlewares(providers);

<<<<<<< HEAD
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
=======
// USERS --------------------------------------------------------------------------------------------------------------
const Users = new UserController(providers, mws);
router.get    <IMyself>             ("/myself",                               Users.readMyself());
router.post   <IUser>               ("/users",                                Users.createUser());
router.post   <void>                ("/users/logout",                         Users.logoutUser());
router.post   <IUser>               ("/users/login",                          Users.loginUser());
router.get    <IUser>               ("/users/@:username",                     Users.readUserByUsername()); // order matters
router.get    <IUser>               ("/users/:uid",                           Users.readUserById());
router.put    <IUser>               ("/users/:uid",                           Users.updateUser());
router.delete <void>                ("/users/:uid",                           Users.deleteUser());
router.get    <IE<IHost, IUHInfo>>  ("/users/:uid/host",                      Users.getUserHost());
router.put    <IUser>               ("/users/:uid/avatar",                    Users.updateUserAvatar());
router.put    <void>                ("/users/:uid/password",                  Users.resetPassword());
// router.get    <IPurchase[]>         ("/users/:uid/purchases",                 Users.getPurchases);
// router.get    <IUserHostInfo>       ("/hosts/:hid/permissions",               Users.getUserHostPermissions);
router.get    <void>                ("/feed",                                 Users.readUserFeed())

// HOSTS --------------------------------------------------------------------------------------------------------------
const Hosts = new HostController(providers, mws);   
router.post   <IHost>               ("/hosts",                                Hosts.createHost());
router.get    <IUser[]>             ("/hosts/:hid/members",                   Hosts.getHostMembers());
// router.put    <IHost>               ("/hosts/:hid",                           Hosts.updateHost());
router.delete <void>                ("/hosts/:hid",                           Hosts.deleteHost());
// router.post   <IHost>               ("/hosts/:hid/membe",                     Hosts.addUser());
// router.delete <IHost>               ("/hosts/:hid/members",                   Hosts.removeUser());
// router.delete <IHost>               ("/hosts/:hid/members/:mid/permissions",  Hosts.alterMemberPermissions());
router.put<void>                    ("/hosts/:hid/onboarding",                Hosts.updateOnboarding());
>>>>>>> 18e18a39d8ae23ea5db33758a52c865eb91f6a21


// PERFORMANCES -------------------------------------------------------------------------------------------------------
const Perfs = new PerfController(providers, mws);
router.post   <IPerf>               ("/performances",                           Perfs.createPerformance());
router.get    <IE<IPerfS[], null>>  ("/performances",                           Perfs.getPerformances());
router.get    <IE<IPerf, IPUInfo>>  ("/performances/:pid",                      Perfs.getPerformance());
router.get    <IPHInfo>             ("/performances/:pid/host_info",            Perfs.getPerformanceHostInfo());
router.post   <void>                ("/performances/:pid/purchase",             Perfs.purchase());
router.delete <void>                ("/performance/:pid",                       Perfs.deletePerformance());

// MUX HOOKS ----------------------------------------------------------------------------------------------------------
const MUXHooks = new MUXHooksController(providers, mws);
router.post   <void>               ("/mux/hooks",                               MUXHooks.handleHook());

// MISC ---------------------------------------------------------------------------------------------------------------
const Auth =  new AuthController(providers, mws);
router.redirect                    ("/auth/verify",                             Auth.verifyUserEmail());
router.get    <string>             ("/ping",                                    { authStrategies: [authorisation.none], controller: async (req:Request) => "Pong!" });

return router;
};