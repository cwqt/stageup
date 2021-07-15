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
  IDeleteHostAssertion as IDelHostAssert,
  IHostPatronTier,
  IHostPatronTier as IHPTier,
  IHostInvoiceStub,
  IUserInvoiceStub,
  IPatronSubscription,
  NUUID,
  IPaymentMethod,
  IPaymentMethodStub,
  IFeed,
  ISignedToken,
  IPasswordConfirmationResponse as IPasswordConfirmRes,
  DtoUserPatronageSubscription as UPatronSub,
  DtoHostPatronageSubscription as HPatronSub,
  IRefund,
  IHostPrivate,
  AssetDto,
  IPerformance,
  ILocale,
  IFollower,
  IFollowing,
  IUserFollow,
  DtoPerformanceAnalytics as DtoPerfAnalytics
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
import PatronageController from './controllers/patronage.controller';

import { BackendModules } from '.';
import { Module } from './modules';
import { BackendProviderMap } from './common/providers';

type ModuleRoutes<T extends {[i:string]: Partial<Pick<Module, "routes">>}> = {[index in keyof T]:T[index]["routes"]};

/**
 * @description: Create a router, passing in the providers to be accessible to routes
 */
export default ({SSE, Queue}:ModuleRoutes<BackendModules>) => (router:AsyncRouter<BackendProviderMap>, providers:BackendProviderMap, middlewares:Middlewares) => {
// MYSELF -------------------------------------------------------------------------------------------------------------
const Myself = new MyselfController(providers, middlewares);
router.get      <IMyself>               ("/myself",                                   Myself.readMyself());
router.get      <IFeed>                 ("/myself/feed",                              Myself.readFeed());
router.post     <IPasswordConfirmRes>   ("/myself/confirm-password",                  Myself.confirmPassword());
router.put      <IMyself["host_info"]>  ("/myself/landing-page",                      Myself.updatePreferredLandingPage());
router.get      <IE<IPerfS[]>>          ("/myself/purchased-performances",            Myself.readMyPurchasedPerformances());
router.get      <IE<IUserInvoiceStub[]>>("/myself/invoices",                          Myself.readInvoices());
router.get      <IUserInvoice>          ("/myself/invoices/:iid",                     Myself.readInvoice());
router.post     <void>                  ("/myself/invoices/:iid/request-refund",      Myself.requestInvoiceRefund());
router.post     <void>                  ("/myself/invoices/request-refund",           Myself.requestInvoiceRefund());
router.get      <IE<UPatronSub[]>>      ("/myself/patron-subscriptions",              Myself.readPatronageSubscriptions());
router.get      <IPaymentMethodStub[]>  ("/myself/payment-methods",                   Myself.readPaymentMethods());
router.post     <IPaymentMethod>        ("/myself/payment-methods",                   Myself.addCreatedPaymentMethod());
router.get      <IPaymentMethod>        ("/myself/payment-methods/:pmid",             Myself.readPaymentMethod());
router.delete   <void>                  ("/myself/payment-methods/:pmid",             Myself.deletePaymentMethod());
router.put      <IPaymentMethod>        ("/myself/payment-methods/:pmid",             Myself.updatePaymentMethod());
router.put      <ILocale>               ("/myself/locale",                            Myself.updateLocale());
router.post     <IFollowing>            ("/myself/follow-host/:hid",                  Myself.addFollow());
router.delete   <void>                  ("/myself/unfollow-host/:hid",                Myself.deleteFollow());

// USERS --------------------------------------------------------------------------------------------------------------
const Users = new UserController(providers, middlewares);
router.post     <IMyself["user"]>       ("/users",                                    Users.createUser());
router.post     <void>                  ("/users/logout",                             Users.logoutUser());
router.post     <IUser>                 ("/users/login",                              Users.loginUser());
router.post     <void>                  ("/users/forgot-password",                    Users.forgotPassword());
router.put      <void>                  ("/users/reset-password",                     Users.resetForgottenPassword());
router.get      <IUser>                 ("/users/:uid",                               Users.readUser());
router.put      <IMyself["user"]>       ("/users/:uid",                               Users.updateUser());
router.delete   <void>                  ("/users/:uid",                               Users.deleteUser());
router.get      <IE<IHost, IUHInfo>>    ("/users/:uid/host",                          Users.readUserHost());
router.put      <string>                ("/users/:uid/avatar",                        Users.changeAvatar());
router.get      <IAddress[]>            ("/users/:uid/addresses",                     Users.readAddresses());
router.post     <IAddress>              ("/users/:uid/addresses",                     Users.createAddress());
router.put      <IAddress>              ("/users/:uid/addresses/:aid",                Users.updateAddress());
router.delete   <void>                  ("/users/:uid/addresses/:aid",                Users.deleteAddress());
router.get      <IE<IFollowing[]>>      ("/users/:uid/following",                     Users.readUserFollows());

// HOSTS --------------------------------------------------------------------------------------------------------------
const Hosts = new HostController(providers, middlewares);
router.post     <IHost>                 ("/hosts",                                    Hosts.createHost());
router.get      <IE<IHost, IUserFollow>>("/hosts/:hid",                               Hosts.readHost())
router.delete   <IDelHostAssert | void> ("/hosts/:hid",                               Hosts.deleteHost());
router.put      <IHostPrivate>          ("/hosts/:hid",                               Hosts.updateHost());
router.get      <IHostPrivate>          ("/hosts/:hid/details",                       Hosts.readDetails());
router.get      <IE<IPerfS[]>>          ("/hosts/:hid/performances",                  Hosts.readHostPerformances());
router.put      <string>                ("/hosts/:hid/avatar",                        Hosts.changeAvatar());
router.put      <string>                ("/hosts/:hid/banner",                        Hosts.changeBanner());
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
// router.post     <void>                  ("/hosts/:hid/performances/:pid/provision",   Hosts.provisionPerformanceAccessTokens());
router.post     <string>                ("/hosts/:hid/stripe/connect",                Hosts.connectStripe());
router.get      <IHostStripeInfo>       ("/hosts/:hid/stripe/info",                   Hosts.readStripeInfo());
router.get      <IE<IHostInvoiceStub[]>>("/hosts/:hid/invoices",                      Hosts.readInvoices());
router.get      <IHostInvoice>          ("/hosts/:hid/invoices/:iid",                 Hosts.readInvoice());
router.get      <IRefund[]>             ('/hosts/:hid/invoices/:iid/refunds',         Hosts.readInvoiceRefunds());
router.post     <void>                  ('/hosts/:hid/invoices/process-refunds',      Hosts.processRefunds());
router.post     <void>                  ("/hosts/:hid/invoices/export-csv",           Hosts.exportInvoicesToCSV());
router.post     <void>                  ("/hosts/:hid/invoices/export-pdf",           Hosts.exportInvoicesToPDF());
router.get      <IE<HPatronSub[]>>      ("/hosts/:hid/patronage/subscribers",         Hosts.readPatronageSubscribers());
router.get      <IE<IFollower[]>>       ("/hosts/:hid/followers",                     Hosts.readHostFollowers());
router.get      <IE<DtoPerfAnalytics[]>>("/hosts/:hid/analytics/performances",        Hosts.readPerformancesAnalytics());

// PATRONAGE ----------------------------------------------------------------------------------------------------------
const Patronage = new PatronageController(providers, middlewares);
router.post     <IHostPatronTier>       ("/hosts/:hid/patron-tiers",                  Patronage.createPatronTier());
router.get      <(IHPTier | IPTier)[]>  ("/hosts/:hid/patron-tiers",                  Patronage.readPatronTiers());
router.put      <IHostPatronTier>       ("/hosts/:hid/patron-tiers/:tid",             Patronage.updatePatronTier());
router.delete   <void>                  ("/hosts/:hid/patron-tiers/:tid",             Patronage.deletePatronTier());
router.post     <IPatronSubscription>   ("/patron-tiers/:tid/subscribe",              Patronage.subscribe());
router.delete   <void>                  ("/patron-tiers/:tid/unsubscribe",            Patronage.unsubscribe());

// PERFORMANCES -------------------------------------------------------------------------------------------------------
const Perfs = new PerfController(providers, middlewares);
router.post     <IPerf>                 ("/hosts/:hid/performances",                  Perfs.createPerformance());
router.get      <IE<IPerfS[]>>          ("/performances",                             Perfs.readPerformances());
router.get      <DtoPerformance>        ("/performances/:pid",                        Perfs.readPerformance());
router.delete   <void>                  ("/performances/:pid",                        Perfs.deletePerformance());
router.put      <IPerf>                 ("/performances/:pid",                        Perfs.updatePerformance());
router.put      <IPerformance>          ("/performances/:pid/publicity-period",       Perfs.updatePublicityPeriod());
router.post     <AssetDto | void>       ("/performances/:pid/thumbnails",             Perfs.changeThumbnails());
router.post     <ICreateAssetRes | void>("/performances/:pid/assets",                 Perfs.createAsset());
router.delete   <void>                  ("/performances/:pid/assets/:aid",            Perfs.deleteAsset());
router.get      <ISignedToken>          ("/performances/:pid/assets/:aid/token",      Perfs.generateSignedToken());
router.get      <ICreateAssetRes>       ("/performances/:pid/assets/:aid/signed-url", Perfs.readVideoAssetSignedUrl());
router.get      <IPHInfo>               ("/performances/:pid/host-info",              Perfs.readPerformanceHostInfo());
router.put      <IPerf>                 ("/performances/:pid/visibility",             Perfs.updateVisibility());
router.get      <IE<ITcktS[], NUUID[]>> ("/performances/:pid/tickets",                Perfs.readTickets());
router.post     <ITicket>               ("/performances/:pid/tickets",                Perfs.createTicket());
router.put      <void>                  ("/performances/:pid/tickets/qty-visibility", Perfs.bulkUpdateTicketQtyVisibility());
router.get      <ITicket>               ("/performances/:pid/tickets/:tid",           Perfs.readTicket());
router.put      <ITicket>               ("/performances/:pid/tickets/:tid",           Perfs.updateTicket());
router.delete   <void>                  ("/performances/:pid/tickets/:tid",           Perfs.deleteTicket());
router.post     <IPaymentICS>           ("/tickets/:tid/payment-intent",              Perfs.createPaymentIntent());

// ADMIN  -------------------------------------------------------------------------------------------------------------
const Admin = new AdminController(providers, middlewares);
router.get      <IE<IHOnboarding[]>>     ("/admin/onboardings",                       Admin.readOnboardingProcesses());
router.post     <void>                   ("/admin/onboardings/:hid/review",           Admin.reviewOnboardingProcess());

// MUX ----------------------------------------------------------------------------------------------------------------
const MUX = new MUXController(providers, middlewares);
router.post     <void>                   ("/mux/hooks",                               MUX.handleHook());

// STRIPE -------------------------------------------------------------------------------------------------------------
const Stripe = new StripeController(providers, middlewares);
router.post     <{ received: boolean }>  ("/stripe/hooks",                            Stripe.handleHook());
router.redirect                          ("/stripe/oauth",                            Stripe.handleStripeConnectReturn());

// AUTH ---------------------------------------------------------------------------------------------------------------
const Auth =  new AuthController(providers, middlewares)
router.redirect                          ("/auth/verify-email",                       Auth.verifyUserEmail());

// MISC ---------------------------------------------------------------------------------------------------------------
const Misc = new MiscController(providers, middlewares);
router.post     <void>                   ("/logs",                                    Misc.logFrontendMessage());
router.get      <string>                 ("/ping",                                    Misc.ping());
router.post     <void>                   ("/drop",                                    Misc.dropAllData());
router.get      <IHost>                  ("/verify-host/:hid",                        Misc.verifyHost());
router.post     <void>                   ("/accept-invite/:uid",                      Misc.acceptHostInvite());
router.get      <void>                   ("/utils/send-test-email",                   Misc.sendTestEmail());
router.get      <void>                   ("/utils/assets",                            Misc.readAssets());
router.get      <void>                   ("/utils/assets/:aid/stream-state",          Misc.setPerformanceStreamState())

// SEARCH ---------------------------------------------------------------------------------------------------------------
const Search = new SearchController(providers, middlewares);
router.get      <ISearchResponse>        ("/search",                                  Search.search());

// SSE ----------------------------------------------------------------------------------------------------------------
router.get                               ("/sse/assets/:aid",                         SSE.performanceStateSSE);

// JOB QUEUE ----------------------------------------------------------------------------------------------------------
router.use                               ("/admin/queue",                             Queue.jobQueueUi.handler);

}
