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
    IHostOnboarding as IHOnboarding,
    IOnboardingStep,
    IAddress,
    IUserStub,
    IPerformanceHostInfo,
    IHostStub
} from "@eventi/interfaces";

import UserController from './controllers/User.controller';
import HostController from './controllers/Host.controller';
import PerfController from './controllers/Performance.controller';
import MUXHooksController from './controllers/MUXHooks.controller';
import AuthController from './controllers/Auth.controller';
import MiscController from './controllers/Misc.controller';
import AdminController from './controllers/Admin.controller';

/**
 * @description: Create a router, passing in the providers to be accessible to routes
 */
export default (providers:DataClient):Router => {
const router = new Router(providers);
const mws = new Middlewares(providers);

// USERS --------------------------------------------------------------------------------------------------------------
const Users = new UserController(providers, mws);
router.get    <IMyself>               ("/myself",                                   Users.readMyself());
router.post   <IUser>                 ("/users",                                    Users.createUser());
router.post   <void>                  ("/users/logout",                             Users.logoutUser());
router.post   <IUser>                 ("/users/login",                              Users.loginUser());
router.put    <void>                  ("/users/forgotpassword",                     Users.forgotPassword());
router.get    <IUser>                 ("/users/@:username",                         Users.readUserByUsername()); // order matters
router.get    <IUser>                 ("/users/:uid",                               Users.readUserById());
router.put    <IUser>                 ("/users/:uid",                               Users.updateUser());
router.delete <void>                  ("/users/:uid",                               Users.deleteUser());
router.get    <IE<IHost, IUHInfo>>    ("/users/:uid/host",                          Users.readUserHost());
router.put    <IUser>                 ("/users/:uid/avatar",                        Users.updateUserAvatar());
router.put    <void>                  ("/users/:uid/password",                      Users.resetPassword());
router.get    <IAddress[]>            ("/users/:uid/addresses",                     Users.readAddresses());
router.post   <IAddress>              ("/users/:uid/addresses",                     Users.createAddress());
router.put    <IAddress>              ("/users/:uid/addresses/:aid",                Users.updateAddress());
router.delete <void>                  ("/users/:uid/addresses/:aid",                Users.deleteAddress());
// router.get    <IPurchase[]>           ("/users/:uid/purchases",                     Users.getPurchases());
// router.get    <IUserHostInfo>         ("/hosts/:hid/permissions",                   Users.getUserHostPermissions());
router.get    <void>                  ("/feed",                                     Users.readUserFeed());

// HOSTS --------------------------------------------------------------------------------------------------------------
const Hosts = new HostController(providers, mws);   
router.post   <IHost>                 ("/hosts",                                    Hosts.createHost());
router.get    <IHost>                 ("/hosts/:hid",                               Hosts.readHost())
router.delete <void>                  ("/hosts/:hid",                               Hosts.deleteHost());
router.put    <IHost>                 ("/hosts/:hid",                               Hosts.updateHost());
router.get    <IUserStub[]>           ("/hosts/:hid/members",                       Hosts.readHostMembers());
// router.post   <IHost>                 ("/hosts/:hid/members",                      Hosts.addUser());
// router.delete <IHost>                 ("/hosts/:hid/members",                      Hosts.removeUser());
// router.delete <IHost>                 ("/hosts/:hid/members/:mid/permissions",     Hosts.alterMemberPermissions());
router.get <IHOnboarding>             ("/hosts/:hid/onboarding/status",             Hosts.readOnboardingProcessStatus());
router.post<void>                     ("/hosts/:hid/onboarding/submit",             Hosts.submitOnboardingProcess());
router.get <IOnboardingStep<any>>     ("/hosts/:hid/onboarding/:step",              Hosts.readOnboardingProcessStep());
router.put <IOnboardingStep<any>>     ("/hosts/:hid/onboarding/:step",              Hosts.updateOnboardingProcessStep());

// PERFORMANCES -------------------------------------------------------------------------------------------------------
const Perfs = new PerfController(providers, mws);
router.post   <IPerf>                 ("/performances",                             Perfs.createPerformance());
router.get    <IE<IPerfS[], null>>    ("/performances",                             Perfs.readPerformances());
router.get    <IE<IPerf, IPUInfo>>    ("/performances/:pid",                        Perfs.readPerformance());
router.get    <IPHInfo>               ("/performances/:pid/host_info",              Perfs.readPerformanceHostInfo());
router.post   <void>                  ("/performances/:pid/purchase",               Perfs.purchase());
router.delete <void>                  ("/performance/:pid",                         Perfs.deletePerformance());

// ADMIN PANEL --------------------------------------------------------------------------------------------------------
const Admin = new AdminController(providers, mws);
router.get  <IE<IHOnboarding[], void>>(`/admin/onboarding`,                         Admin.readOnboardingProcesses());
router.post  <void>                   (`/admin/onboarding/:oid/:step/review`,       Admin.reviewStep());
router.post <void>                    ("/admin/onboarding/:oid/submit",             Admin.submitOnboardingProcess());

// MUX HOOKS ----------------------------------------------------------------------------------------------------------
const MUXHooks = new MUXHooksController(providers, mws);
router.post   <void>                  ("/mux/hooks",                                MUXHooks.handleHook());

// AUTH ---------------------------------------------------------------------------------------------------------------
const Auth =  new AuthController(providers, mws);
router.redirect                       ("/auth/verify",                              Auth.verifyUserEmail());

// MISC ---------------------------------------------------------------------------------------------------------------
const Misc = new MiscController(providers, mws);
router.get    <string>                ("/ping",                                     Misc.ping());
router.post   <void>                  ("/drop",                                     Misc.dropAllData());
router.get    <void>                  ("/test",                                     Misc.test());
router.get    <void>                  ("/verifyhost/:hid",                          Misc.verifyHost());

return router;
};
