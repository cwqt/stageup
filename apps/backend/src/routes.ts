import { AsyncRouter, Middlewares } from '@core/shared/api';

import {
  IHost,
  IUser,
  IPerformanceStub as IPerfS,
  IPerformance as IPerf,
  IPerformanceHostInfo as IPHInfo, 
  IUserHostInfo as IUHInfo,
  IEnvelopedData as IE,
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
  IHostStripeInfo,
  IPaymentIntentClientSecret as IPaymentICS
} from '@core/interfaces';

import UserController from './controllers/user.controller';
import HostController from './controllers/host.controller';
import PerfController from './controllers/performance.controller';
import MUXController from './controllers/mux.controller';
import AuthController from './controllers/auth.controller';
import MiscController from './controllers/misc.controller';
import AdminController from './controllers/admin.controller';
import StripeController from './controllers/stripe.controller';
import SearchController from './controllers/search.controller';
import { BackendProviderMap } from '.';

/**
 * @description: Create a router, passing in the providers to be accessible to routes
 */
export default (router:AsyncRouter<BackendProviderMap>, providerMap:BackendProviderMap, middlewares:Middlewares) => {
// USERS --------------------------------------------------------------------------------------------------------------
const Users = new UserController(providerMap, middlewares);
router.get      <IMyself>               ("/myself",                                   Users.readMyself());
router.put      <IMyself["host_info"]>  ("/myself/landing-page",                      Users.updatePreferredLandingPage());
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
// router.put      <void>                  ("/users/forgot-password",                    Users.forgotPassword());
router.put      <void>                  ("/users/:uid/password",                      Users.resetPassword());
router.get      <IAddress[]>            ("/users/:uid/addresses",                     Users.readAddresses());
router.post     <IAddress>              ("/users/:uid/addresses",                     Users.createAddress());
router.put      <IAddress>              ("/users/:uid/addresses/:aid",                Users.updateAddress());
router.delete   <void>                  ("/users/:uid/addresses/:aid",                Users.deleteAddress());
// router.get      <IPurchase[]>           ("/users/:uid/purchases",                     Users.getPurchases());

// HOSTS --------------------------------------------------------------------------------------------------------------
const Hosts = new HostController(providerMap, middlewares);
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
router.post     <string>                ("/hosts/:hid/stripe/connect",                Hosts.connectStripe());
router.get      <IHostStripeInfo>       ("/hosts/:hid/stripe/info",                   Hosts.readStripeInfo());

// PERFORMANCES -------------------------------------------------------------------------------------------------------
const Perfs = new PerfController(providerMap, middlewares);
router.post     <IPerf>                 ("/hosts/:hid/performances",                  Perfs.createPerformance());
router.get      <IE<IPerfS[]>>          ("/performances",                             Perfs.readPerformances());
router.get      <IE<IPerf, DtoAT>>      ("/performances/:pid",                        Perfs.readPerformance());
router.get      <IPHInfo>               ("/performances/:pid/host-info",              Perfs.readPerformanceHostInfo());
router.delete   <void>                  ("/performances/:pid",                        Perfs.deletePerformance());
router.put      <IPerf>                 ("/performances/:pid",                        Perfs.updatePerformance());
router.put      <IPerf>                 ("/performances/:pid/visibility",             Perfs.updateVisibility());
router.post     <ITicket>               ("/performances/:pid/tickets",                Perfs.createTicket());
router.get      <ITicketStub[]>         ("/performances/:pid/tickets",                Perfs.readTickets());
router.delete   <void>                  ("/performances/:pid/tickets/:tid",           Perfs.deleteTicket());
router.post     <IPaymentICS>           ("/tickets/:tid/payment-intent",              Perfs.createPaymentIntent());

// ADMIN  -------------------------------------------------------------------------------------------------------------
const Admin = new AdminController(providerMap, middlewares);
router.get      <IE<IHOnboarding[]>>     ("/admin/onboardings",                       Admin.readOnboardingProcesses());
router.post     <void>                   ("/admin/onboardings/:hid/review",           Admin.reviewOnboardingProcess());
router.post     <void>                   ("/admin/onboardings/:hid/enact",            Admin.enactOnboardingProcess());

// MUX ----------------------------------------------------------------------------------------------------------------
const MUX = new MUXController(providerMap, middlewares);
router.post     <void>                   ("/mux/hooks",                               MUX.handleHook());

// STRIPE -------------------------------------------------------------------------------------------------------------
const Stripe = new StripeController(providerMap, middlewares);
router.post     <{ received: boolean }>  ("/stripe/hooks",                            Stripe.handleHook());
router.redirect                          ("/stripe/return",                           Stripe.handleStripeConnectReturn());
router.redirect                          ("/stripe/refresh",                          Stripe.handleStripeConnectRefresh());

// AUTH ---------------------------------------------------------------------------------------------------------------
const Auth =  new AuthController(providerMap, middlewares)
router.redirect                          ("/auth/verify-email",                       Auth.verifyUserEmail());

// MISC ---------------------------------------------------------------------------------------------------------------
const Misc = new MiscController(providerMap, middlewares);
router.get      <string>                 ("/ping",                                    Misc.ping());
router.post     <void>                   ("/drop",                                    Misc.dropAllData());
router.get      <IHost>                  ("/verify-host/:hid",                        Misc.verifyHost());
router.post     <void>                   ("/accept-invite/:uid",                      Misc.acceptHostInvite());
router.get      <void>                   ("/sendgrid",                                Misc.testSendGrid());

// SEARCH ---------------------------------------------------------------------------------------------------------------
const Search = new SearchController(providerMap, middlewares);
router.get      <ISearchResponse>        ("/search",                                  Search.search());

}
