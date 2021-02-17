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
    IEnvelopedData as IE,
    IPerformanceUserInfo as IPUInfo,
    IMyself,
    IHostOnboarding as IHOnboarding,
    IOnboardingStep,
    IAddress,
    IOnboardingStepMap,
} from '@core/interfaces';

import UserController from './controllers/user.controller';
import HostController from './controllers/host.controller';
import PerfController from './controllers/performance.controller';
import MUXHooksController from './controllers/mux-hooks.controller';
import AuthController from './controllers/auth.controller';
import MiscController from './controllers/misc.controller';
import AdminController from './controllers/admin.controller';

/**
 * @description: Create a router, passing in the providers to be accessible to routes
 */
export default (providers:DataClient):Router => {
const router = new Router(providers);
const mws = new Middlewares(providers);

// USERS --------------------------------------------------------------------------------------------------------------
const Users = new UserController(providers, mws);
router.get      <IMyself>               ("/myself",                                   Users.readMyself());
// router.get      <void>                  ("/feed",                                     Users.readUserFeed());
router.post     <IMyself["user"]>       ("/users",                                    Users.createUser());
router.post     <void>                  ("/users/logout",                             Users.logoutUser());
router.post     <IUser>                 ("/users/login",                              Users.loginUser());
router.get      <IUser>                 ("/users/@:username",                         Users.readUserByUsername()); // order matters
router.get      <IUser>                 ("/users/:uid",                               Users.readUserById());
router.put      <IMyself["user"]>       ("/users/:uid",                               Users.updateUser());
router.delete   <void>                  ("/users/:uid",                               Users.deleteUser());
router.get      <IE<IHost, IUHInfo>>    ("/users/:uid/host",                          Users.readUserHost());
// router.put      <IMyself["user"]>       ("/users/:uid/avatar",                        Users.updateUserAvatar());
// router.put      <void>                  ("/users/forgotpassword",                     Users.forgotPassword());
router.put      <void>                  ("/users/:uid/password",                      Users.resetPassword());
router.get      <IAddress[]>            ("/users/:uid/addresses",                     Users.readAddresses());
router.post     <IAddress>              ("/users/:uid/addresses",                     Users.createAddress());
router.put      <IAddress>              ("/users/:uid/addresses/:aid",                Users.updateAddress());
router.delete   <void>                  ("/users/:uid/addresses/:aid",                Users.deleteAddress());
// router.get      <IPurchase[]>           ("/users/:uid/purchases",                     Users.getPurchases());

// HOSTS --------------------------------------------------------------------------------------------------------------
const Hosts = new HostController(providers, mws);
router.post     <IHost>                 ("/hosts",                                    Hosts.createHost());
router.get      <IHost>                 ("/hosts/@:username",                         Hosts.readHostByUsername()); // order matters
router.get      <IHost>                 ("/hosts/:hid",                               Hosts.readHost())
router.delete   <void>                  ("/hosts/:hid",                               Hosts.deleteHost());
// router.put      <IHost>                 ("/hosts/:hid",                               Hosts.updateHost());
router.get      <IE<IUHInfo[]>>         ("/hosts/:hid/members",                       Hosts.readMembers());
router.post     <IUHInfo>               ("/hosts/:hid/members",                       Hosts.addMember());
router.delete   <void>                  ("/hosts/:hid/members/:mid",                  Hosts.removeMember());
router.put      <void>                  ("/hosts/:hid/members/:mid",                  Hosts.updateMember());
router.get      <IHOnboarding>          ("/hosts/:hid/onboarding/status",             Hosts.readOnboardingProcessStatus());
router.post     <void>                  ("/hosts/:hid/onboarding/submit",             Hosts.submitOnboardingProcess());
router.get      <IOnboardingStepMap>    ("/hosts/:hid/onboarding/steps",              Hosts.readOnboardingSteps());
router.get      <IOnboardingStep>       ("/hosts/:hid/onboarding/:step",              Hosts.readOnboardingProcessStep());
router.put      <IOnboardingStep>       ("/hosts/:hid/onboarding/:step",              Hosts.updateOnboardingProcessStep());
router.redirect                         ("/hosts/:hid/invites/:iid",                  Hosts.handleHostInvite());
router.get      <IE<IPerfS[]>>          ("/hosts/:hid/performances",                  Hosts.readHostPerformances());

// PERFORMANCES -------------------------------------------------------------------------------------------------------
const Perfs = new PerfController(providers, mws);
router.post     <IPerf>                 ("/hosts/:hid/performances",                  Perfs.createPerformance());
router.get      <IE<IPerfS[]>>          ("/performances",                             Perfs.readPerformances());
router.get      <IE<IPerf, IPUInfo>>    ("/performances/:pid",                        Perfs.readPerformance());
router.get      <IPHInfo>               ("/performances/:pid/host_info",              Perfs.readPerformanceHostInfo());
router.post     <void>                  ("/performances/:pid/purchase",               Perfs.purchase());
router.delete   <void>                  ("/performances/:pid",                        Perfs.deletePerformance());
router.put      <IPerf>                 ("/performances/:pid",                        Perfs.updatePerformance());
router.put      <IPerf>                 ("/performances/:pid/visibility",             Perfs.updateVisibility());

// ADMIN PANEL --------------------------------------------------------------------------------------------------------
const Admin = new AdminController(providers, mws);
router.get      <IE<IHOnboarding[]>>     (`/admin/onboardings`,                       Admin.readOnboardingProcesses());
router.post     <void>                   (`/admin/onboardings/:oid/review`,           Admin.reviewOnboardingProcess());
router.post     <void>                   ("/admin/onboardings/:oid/enact",            Admin.enactOnboardingProcess());

// MUX HOOKS ----------------------------------------------------------------------------------------------------------
const MUXHooks = new MUXHooksController(providers, mws);
router.post     <void>                  ("/mux/hooks",                                MUXHooks.handleHook());

// AUTH ---------------------------------------------------------------------------------------------------------------
const Auth =  new AuthController(providers, mws)
router.redirect                       ("/auth/verify",                                Auth.verifyUserEmail());

// MISC ---------------------------------------------------------------------------------------------------------------
const Misc = new MiscController(providers, mws);
router.get      <string>                ("/ping",                                     Misc.ping());
router.post     <void>                  ("/drop",                                     Misc.dropAllData());
router.get      <IHost>                 ("/verifyhost/:hid",                          Misc.verifyHost());
router.post     <void>                  ("/acceptinvite/:uid",                        Misc.acceptHostInvite());

return router;
};