import { AsyncRouter, Middlewares } from '@core/api';

import {
  IHost,
  IUser,
  IPerformanceStub as IPerfS,
  IPerformance as IPerf,
  IPerformanceHostInfo as IPHInfo,
  IUserHostInfo as IUHInfo,
  IEnvelopedData as IE,
  IMyself,
  DtoPerformance,
  ICreateAssetRes,
  IHostOnboarding as IHOnboarding,
  IOnboardingStep,
  IAddress,
  IOnboardingStepMap,
  ISearchResponse,
  IHostStub as IHostS,
  ITicket,
  ITicketStub as ITcktS,
  IUserStub as IUserS,
  IHostStripeInfo,
  IPaymentIntentClientSecret as IPaymentICS,
  IHostInvoice,
  IUserInvoice,
  IPatronTier as IPTier,
  IHostPatronTier,
  IHostPatronTier as IHPTier,
  IHostInvoiceStub,
  IUserInvoiceStub,
  IPatronSubscription,
  NUUID,
  IPaymentMethod,
  IPaymentMethodStub,
  IFeed
} from '@core/interfaces';

import MyselfController from './controllers/myself.controller';
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
import PatronageController from './controllers/patronage.controller';

/**
 * @description: Create a router, passing in the providers to be accessible to routes
 */
export default (router:AsyncRouter<BackendProviderMap>, providerMap:BackendProviderMap, middlewares:Middlewares) => {
// MYSELF -------------------------------------------------------------------------------------------------------------
const Myself = new MyselfController(providerMap, middlewares);
router.get      <IMyself>               ("/myself",                                   Myself.readMyself());
router.get      <IFeed>                 ("/myself/feed",                              Myself.readFeed());
router.put      <IMyself["host_info"]>  ("/myself/landing-page",                      Myself.updatePreferredLandingPage());
router.get      <IE<IPerfS[]>>          ("/myself/purchased-performances",            Myself.readMyPurchasedPerformances());
router.get      <IE<IUserInvoiceStub[]>>("/myself/invoices",                          Myself.readInvoices());
router.get      <IUserInvoice>          ("/myself/invoices/:iid",                     Myself.readInvoice());
router.get      <IPaymentMethodStub[]>  ("/myself/payment-methods",                   Myself.readPaymentMethods());
router.post     <IPaymentMethod>        ("/myself/payment-methods",                   Myself.addCreatedPaymentMethod());
router.get      <IPaymentMethod>        ("/myself/payment-methods/:pmid",             Myself.readPaymentMethod());
router.delete   <void>                  ("/myself/payment-methods/:pmid",             Myself.deletePaymentMethod());
router.put      <IPaymentMethod>        ("/myself/payment-methods/:pmid",             Myself.updatePaymentMethod());

// USERS --------------------------------------------------------------------------------------------------------------
const Users = new UserController(providerMap, middlewares);
router.post     <IMyself["user"]>       ("/users",                                    Users.createUser());
router.post     <void>                  ("/users/logout",                             Users.logoutUser());
router.post     <IUser>                 ("/users/login",                              Users.loginUser());
router.post     <void>                  ("/users/forgot-password",                    Users.forgotPassword());
router.put      <void>                  ("/users/reset-password",                     Users.resetForgottenPassword());
router.get      <IUser>                 ("/users/@:username",                         Users.readUserByUsername()); // order matters
router.get      <IUser>                 ("/users/:uid",                               Users.readUserById());
router.put      <IMyself["user"]>       ("/users/:uid",                               Users.updateUser());
router.delete   <void>                  ("/users/:uid",                               Users.deleteUser());
router.get      <IE<IHost, IUHInfo>>    ("/users/:uid/host",                          Users.readUserHost());
router.put      <IUserS>                ("/users/:uid/avatar",                        Users.changeAvatar());
router.get      <IAddress[]>            ("/users/:uid/addresses",                     Users.readAddresses());
router.post     <IAddress>              ("/users/:uid/addresses",                     Users.createAddress());
router.put      <IAddress>              ("/users/:uid/addresses/:aid",                Users.updateAddress());
router.delete   <void>                  ("/users/:uid/addresses/:aid",                Users.deleteAddress());

// HOSTS --------------------------------------------------------------------------------------------------------------
const Hosts = new HostController(providerMap, middlewares);
router.post     <IHost>                 ("/hosts",                                    Hosts.createHost());
router.get      <IHost>                 ("/hosts/@:username",                         Hosts.readHostByUsername()); // order matters
router.get      <IHost>                 ("/hosts/:hid",                               Hosts.readHost())
router.delete   <void>                  ("/hosts/:hid",                               Hosts.deleteHost());
// router.put      <IHost>                 ("/hosts/:hid",                               Hosts.updateHost());
router.get      <IE<IPerfS[]>>          ("/hosts/:hid/performances",                  Hosts.readHostPerformances());
router.put      <IHostS>                ("/hosts/:hid/avatar",                        Hosts.changeAvatar());
router.put      <IHostS>                ("/hosts/:hid/banner",                        Hosts.changeBanner());
router.get      <IE<IUHInfo[]>>         ("/hosts/:hid/members",                       Hosts.readMembers());
router.post     <IUHInfo>               ("/hosts/:hid/members",                       Hosts.addMember());
router.delete   <void>                  ("/hosts/:hid/members/:uid",                  Hosts.removeMember());
router.put      <void>                  ("/hosts/:hid/members/:uid",                  Hosts.updateMember());
router.get      <IHOnboarding>          ("/hosts/:hid/onboarding/status",             Hosts.readOnboardingProcessStatus());
router.post     <void>                  ("/hosts/:hid/onboarding/submit",             Hosts.submitOnboardingProcess());
router.get      <IOnboardingStepMap>    ("/hosts/:hid/onboarding/steps",              Hosts.readOnboardingSteps());
router.get      <IOnboardingStep>       ("/hosts/:hid/onboarding/:step",              Hosts.readOnboardingProcessStep());
router.put      <IOnboardingStep>       ("/hosts/:hid/onboarding/:step",              Hosts.updateOnboardingProcessStep());
router.redirect                         ("/hosts/:hid/invites/:iid",                  Hosts.handleHostInvite());
router.post     <void>                  ("/hosts/:hid/performances/:pid/provision",   Hosts.provisionPerformanceAccessTokens());
router.post     <string>                ("/hosts/:hid/stripe/connect",                Hosts.connectStripe());
router.get      <IHostStripeInfo>       ("/hosts/:hid/stripe/info",                   Hosts.readStripeInfo());
router.get      <IE<IHostInvoiceStub[]>>("/hosts/:hid/invoices",                      Hosts.readInvoices());
router.get      <IHostInvoice>          ("/hosts/:hid/invoices/:iid",                 Hosts.readInvoice());
router.post     <void>                  ("/hosts/:hid/invoices/export-csv",           Hosts.exportInvoicesToCSV());
router.post     <void>                  ("/hosts/:hid/invoices/export-pdf",           Hosts.exportInvoicesToPDF());

// PATRONAGE ----------------------------------------------------------------------------------------------------------
const Patronage = new PatronageController(providerMap, middlewares);
router.post     <IHostPatronTier>       ("/hosts/:hid/patron-tiers",                  Patronage.createPatronTier());
router.get      <(IHPTier | IPTier)[]>  ("/hosts/:hid/patron-tiers",                  Patronage.readPatronTiers());
router.delete   <void>                  ("/hosts/:hid/patron-tiers/:tid",             Patronage.deletePatronTier());
router.post     <IPatronSubscription>   ("/hosts/:hid/patron-tiers/:tid/subscribe",   Patronage.subscribeToPatronTier());
// router.delete   <void>                  ("/hosts/:hid/patron-tiers/:tid/unsubscribe", Patronage.unsubscribeFromPatronTier());

// PERFORMANCES -------------------------------------------------------------------------------------------------------
const Perfs = new PerfController(providerMap, middlewares);
router.post     <IPerf>                 ("/hosts/:hid/performances",                  Perfs.createPerformance());
router.get      <IE<IPerfS[]>>          ("/performances",                             Perfs.readPerformances());
router.get      <DtoPerformance>        ("/performances/:pid",                        Perfs.readPerformance());
router.delete   <void>                  ("/performances/:pid",                        Perfs.deletePerformance());
router.put      <IPerf>                 ("/performances/:pid",                        Perfs.updatePerformance());
router.post     <ICreateAssetRes|void>  ("/performances/:pid/assets",                 Perfs.createAsset());
router.get      <IPHInfo>               ("/performances/:pid/host-info",              Perfs.readPerformanceHostInfo());
// router.delete   <void>                  ("/performances/:pid/assets/:aid",            Perfs.deleteAsset());
router.put      <IPerf>                 ("/performances/:pid/visibility",             Perfs.updateVisibility());
router.get      <IE<ITcktS[], NUUID[]>> ("/performances/:pid/tickets",                Perfs.readTickets());
router.post     <ITicket>               ("/performances/:pid/tickets",                Perfs.createTicket());
router.put      <void>                  ("/performances/:pid/tickets/qty-visibility", Perfs.bulkUpdateTicketQtyVisibility());
router.get      <ITicket>               ("/performances/:pid/tickets/:tid",           Perfs.readTicket());
router.put      <ITicket>               ("/performances/:pid/tickets/:tid",           Perfs.updateTicket());
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
router.redirect                          ("/stripe/oauth",                           Stripe.handleStripeConnectReturn());

// AUTH ---------------------------------------------------------------------------------------------------------------
const Auth =  new AuthController(providerMap, middlewares)
router.redirect                          ("/auth/verify-email",                       Auth.verifyUserEmail());

// MISC ---------------------------------------------------------------------------------------------------------------
const Misc = new MiscController(providerMap, middlewares);
router.post     <void>                   ("/logs",                                    Misc.logFrontendMessage());
router.get      <string>                 ("/ping",                                    Misc.ping());
router.post     <void>                   ("/drop",                                    Misc.dropAllData());
router.get      <IHost>                  ("/verify-host/:hid",                        Misc.verifyHost());
router.post     <void>                   ("/accept-invite/:uid",                      Misc.acceptHostInvite());
router.get      <void>                   ("/sendgrid",                                Misc.testSendGrid());
router.get      <void>                   ("/utils/performances/:pid/state",           Misc.setPerformanceStreamState())

// SEARCH ---------------------------------------------------------------------------------------------------------------
const Search = new SearchController(providerMap, middlewares);
router.get      <ISearchResponse>        ("/search",                                  Search.search());
}
