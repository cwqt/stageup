import { DataClient, AsyncRouter, Middlewares } from '@core/shared/api';

import {
  IHost,
  IUser,
  IPerformanceStub as IPerfS,
  IPerformance as IPerf,
  IPerformanceHostInfo as IPHInfo, 
  IUserHostInfo as IUHInfo,
  IEnvelopedData as IE,
  IPerformanceUserInfo,
  IMyself,
  DtoAccessToken as DtoAT,
  IHostOnboarding as IHOnboarding,
  IOnboardingStep,
  IAddress,
  IOnboardingStepMap,
  ISearchResponse,
  IHostStub as IHostS,
  ITicket,
  ITicketStub,
  IUserStub as IUserS,
} from '@core/interfaces';
import { BackendDataClient } from './common/data';

import UserController from './controllers/user.controller';
import HostController from './controllers/host.controller';
import PerfController from './controllers/performance.controller';
import MUXController from './controllers/mux.controller';
import AuthController from './controllers/auth.controller';
import MiscController from './controllers/misc.controller';
import AdminController from './controllers/admin.controller';
import SearchController from './controllers/search.controller';

/**
 * @description: Create a router, passing in the providers to be accessible to routes
 */
export default (router: AsyncRouter, client: DataClient<BackendDataClient>, mws: Middlewares) => {
// USERS --------------------------------------------------------------------------------------------------------------
const Users = new UserController(client, mws);
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
router.put      <IUserS>                ("/users/:uid/avatar",                        Users.changeAvatar());
// router.put      <void>                  ("/users/forgotpassword",                     Users.forgotPassword());
router.put      <void>                  ("/users/:uid/password",                      Users.resetPassword());
router.get      <IAddress[]>            ("/users/:uid/addresses",                     Users.readAddresses());
router.post     <IAddress>              ("/users/:uid/addresses",                     Users.createAddress());
router.put      <IAddress>              ("/users/:uid/addresses/:aid",                Users.updateAddress());
router.delete   <void>                  ("/users/:uid/addresses/:aid",                Users.deleteAddress());
// router.get      <IPurchase[]>           ("/users/:uid/purchases",                     Users.getPurchases());

// HOSTS --------------------------------------------------------------------------------------------------------------
const Hosts = new HostController(client, mws);
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
router.put      <IHostS>                ("/hosts/:hid/avatar",                        Hosts.changeAvatar());
router.put      <IHostS>                ("/hosts/:hid/banner",                        Hosts.changeBanner());
router.post     <void>                  ("/hosts/:hid/performances/:pid/provision",   Hosts.provisionPerformanceAccessTokens());

// PERFORMANCES -------------------------------------------------------------------------------------------------------
const Perfs = new PerfController(client, mws);
router.post     <IPerf>                 ("/hosts/:hid/performances",                  Perfs.createPerformance());
router.get      <IE<IPerfS[]>>          ("/performances",                             Perfs.readPerformances());
router.get      <IE<IPerf, DtoAT>>      ("/performances/:pid",                        Perfs.readPerformance());
router.get      <IPHInfo>               ("/performances/:pid/host_info",              Perfs.readPerformanceHostInfo());
router.post     <void>                  ("/performances/:pid/purchase",               Perfs.purchase());
router.delete   <void>                  ("/performances/:pid",                        Perfs.deletePerformance());
router.put      <IPerf>                 ("/performances/:pid",                        Perfs.updatePerformance());
router.put      <IPerf>                 ("/performances/:pid/visibility",             Perfs.updateVisibility());
router.post     <ITicket>               ("/performances/:pid/tickets",                Perfs.createTicket());
router.get      <ITicketStub[]>         ("/performances/:pid/tickets",                Perfs.readTickets());
router.delete   <void>                  ("/performances/:pid/tickets/:tid",           Perfs.deleteTicket());

// ADMIN PANEL --------------------------------------------------------------------------------------------------------
const Admin = new AdminController(client, mws);
router.get      <IE<IHOnboarding[]>>     (`/admin/onboardings`,                       Admin.readOnboardingProcesses());
router.post     <void>                   (`/admin/onboardings/:oid/review`,           Admin.reviewOnboardingProcess());
router.post     <void>                   ("/admin/onboardings/:oid/enact",            Admin.enactOnboardingProcess());

// MUX HOOKS ----------------------------------------------------------------------------------------------------------
const MUX = new MUXController(client, mws);
router.post     <void>                   ("/mux/hooks",                               MUX.handleHook());

// AUTH ---------------------------------------------------------------------------------------------------------------
const Auth =  new AuthController(client, mws)
router.redirect                          ("/auth/verify",                             Auth.verifyUserEmail());

// MISC ---------------------------------------------------------------------------------------------------------------
const Misc = new MiscController(client, mws);
router.get      <string>                 ("/ping",                                    Misc.ping());
router.post     <void>                   ("/drop",                                    Misc.dropAllData());
router.get      <IHost>                  ("/verifyhost/:hid",                         Misc.verifyHost());
router.post     <void>                   ("/acceptinvite/:uid",                       Misc.acceptHostInvite());
router.get      <void>                   ("/sendgrid",                                Misc.testSendGrid());

// SEARCH ---------------------------------------------------------------------------------------------------------------
const Search = new SearchController(client, mws);
router.get      <ISearchResponse>        ("/search",                                  Search.search());

}
