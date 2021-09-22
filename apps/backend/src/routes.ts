import Container from 'typedi';
import { AsyncRouter, Performance } from '@core/api';
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
  ITicket,
  ITicketStub as ITcktS,
  IHostStripeInfo,
  IPaymentIntentClientSecret as IPaymentICS,
  IHostInvoice,
  IUserInvoice,
  IDeleteHostAssertion as IDelHostAssert,
  IHostInvoiceStub,
  IUserHostMarketingConsent as IUserHostMC,
  IUserInvoiceStub,
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
  DtoPerformanceAnalytics as DtoPerfAnalytics,
  DtoHostAnalytics,
  ConsentableType as CT,
  IConsentable,
  IDynamicFrontendEnvironment as IDynamicFeEnv,
  IHostFeed,
  PlatformConsentOpt
} from '@core/interfaces';


import { MyselfController } from './modules/myself/myself.controller';
import { UserController } from './modules/user/user.controller';
import { HostController } from './modules/host/host.controller';
import { PerformanceController } from './modules/performance/performance.controller';
import { SSEController } from './modules/sse/sse.controller';
import { SearchController } from './modules/search/search.controller';
import { AdminController } from './modules/admin/admin.controller';
import { MuxController } from './modules/mux/mux.controller';
import { StripeController } from './modules/stripe/stripe.controller';
import { AuthController } from './modules/auth/auth.controller';
import { GdprController } from './modules/gdpr/gdpr.controller';
import { UtilityController } from './modules/utils/utils.controller';
import { JobQueueController } from './modules/queue/queue.controller';

export default  (router:AsyncRouter) => {
// MYSELF -------------------------------------------------------------------------------------------------------------
const Myself = Container.get(MyselfController);
router.get      <IMyself>               ("/myself",                                   Myself.readMyself);
router.get      <IFeed>                 ("/myself/feed",                              Myself.readFeed);
router.post     <IPasswordConfirmRes>   ("/myself/confirm-password",                  Myself.confirmPassword);
router.put      <IMyself["host_info"]>  ("/myself/landing-page",                      Myself.updatePreferredLandingPage);
router.get      <IE<IPerfS[]>>          ("/myself/purchased-performances",            Myself.readMyPurchasedPerformances);
router.get      <IE<IUserInvoiceStub[]>>("/myself/invoices",                          Myself.readInvoices);
router.get      <IUserInvoice>          ("/myself/invoices/:iid",                     Myself.readInvoice);
router.post     <void>                  ("/myself/invoices/:iid/request-refund",      Myself.requestInvoiceRefund);
router.post     <void>                  ("/myself/invoices/request-refund",           Myself.requestInvoiceRefund);
router.get      <IE<UPatronSub[]>>      ("/myself/patron-subscriptions",              Myself.readPatronageSubscriptions);
router.get      <IFeed>                 ("/myself/feed",                              Myself.readFeed);
router.get      <IPaymentMethodStub[]>  ("/myself/payment-methods",                   Myself.readPaymentMethods);
router.post     <IPaymentMethod>        ("/myself/payment-methods",                   Myself.addCreatedPaymentMethod);
router.get      <IPaymentMethod>        ("/myself/payment-methods/:pmid",             Myself.readPaymentMethod);
router.delete   <void>                  ("/myself/payment-methods/:pmid",             Myself.deletePaymentMethod);
router.put      <IPaymentMethod>        ("/myself/payment-methods/:pmid",             Myself.updatePaymentMethod);
router.put      <ILocale>               ("/myself/locale",                            Myself.updateLocale);
router.post     <IFollowing>            ("/myself/follow-host/:hid",                  Myself.addFollow);
router.delete   <void>                  ("/myself/unfollow-host/:hid",                Myself.deleteFollow);
router.get      <IE<IUserHostMC[]>>     ("/myself/opt-ins/host-marketing",            Myself.readUserHostMarketingConsents);
router.get      <PlatformConsentOpt>    ("/myself/opt-ins/platform",                  Myself.readUserPlatformMarketingConsent);
router.put      <void>                  ("/myself/opt-ins/platform",                  Myself.updatePlatformMarketingConsent);
router.put      <void>                  ("/myself/opt-ins/host-marketing/:hid",       Myself.updateHostOptInStatus);
router.put      <void>                  ("/myself/opt-ins/prompts/host-marketing",    Myself.updateShowHostMarketingPrompts);

// USERS --------------------------------------------------------------------------------------------------------------
const Users = Container.get(UserController)
router.post     <IMyself["user"]>       ("/users",                                    Users.createUser);
router.post     <void>                  ("/users/logout",                             Users.logoutUser);
router.post     <IUser>                 ("/users/login",                              Users.loginUser);
router.post     <IUser>                 ("/users/login/social",                       Users.signInUser);
// router.post     <IUser>                 ("/users/login/google",                       Users.loginUserWithGoogle);
// router.post     <IUser>                 ("/users/login/facebook",                     Users.loginUserWithFacebook);
router.post     <void>                  ("/users/forgot-password",                    Users.forgotPassword);
router.put      <void>                  ("/users/reset-password",                     Users.resetForgottenPassword);
router.get      <IUser>                 ("/users/:uid",                               Users.readUser);
router.put      <IMyself["user"]>       ("/users/:uid",                               Users.updateUser);
router.delete   <void>                  ("/users/:uid",                               Users.deleteUser);
router.get      <IE<IHost, IUHInfo>>    ("/users/:uid/host",                          Users.readUserHost);
router.put      <string>                ("/users/:uid/avatar",                        Users.changeAvatar);
router.get      <IAddress[]>            ("/users/:uid/addresses",                     Users.readAddresses);
router.post     <IAddress>              ("/users/:uid/addresses",                     Users.createAddress);
router.put      <IAddress>              ("/users/:uid/addresses/:aid",                Users.updateAddress);
router.delete   <void>                  ("/users/:uid/addresses/:aid",                Users.deleteAddress);
router.get      <IE<IFollowing[]>>      ("/users/:uid/following",                     Users.readUserFollows);

// HOSTS --------------------------------------------------------------------------------------------------------------
const Hosts = Container.get(HostController)
router.post     <IHost>                 ("/hosts",                                    Hosts.createHost);
router.get      <IE<IHost, IUserFollow>>("/hosts/:hid",                               Hosts.readHost)
router.delete   <IDelHostAssert | void> ("/hosts/:hid",                               Hosts.deleteHost);
router.put      <IHostPrivate>          ("/hosts/:hid",                               Hosts.updateHost);
router.get      <IHostPrivate>          ("/hosts/:hid/details",                       Hosts.readDetails);
router.get      <IE<IPerfS[]>>          ("/hosts/:hid/performances",                  Hosts.readHostPerformances);
router.get      <IHostFeed>             ("/hosts/:hid/feed",                          Hosts.readHostFeed);
router.put      <string>                ("/hosts/:hid/avatar",                        Hosts.changeAvatar);
router.put      <string>                ("/hosts/:hid/banner",                        Hosts.changeBanner);
router.get      <IE<IUHInfo[]>>         ("/hosts/:hid/members",                       Hosts.readMembers);
router.post     <IUHInfo>               ("/hosts/:hid/members",                       Hosts.addMember);
router.delete   <void>                  ("/hosts/:hid/members/:uid",                  Hosts.removeMember);
router.put      <void>                  ("/hosts/:hid/members/:uid",                  Hosts.updateMember);
router.get      <IHOnboarding>          ("/hosts/:hid/onboarding/status",             Hosts.readOnboardingProcessStatus);
router.post     <void>                  ("/hosts/:hid/onboarding/submit",             Hosts.submitOnboardingProcess);
router.get      <IOnboardingStepMap>    ("/hosts/:hid/onboarding/steps",              Hosts.readOnboardingSteps);
router.get      <IOnboardingStep>       ("/hosts/:hid/onboarding/:step",              Hosts.readOnboardingProcessStep);
router.put      <IOnboardingStep>       ("/hosts/:hid/onboarding/:step",              Hosts.updateOnboardingProcessStep);
router.redirect                         ("/hosts/:hid/invites/:iid",                  Hosts.handleHostInvite);
// router.post     <void>                  ("/hosts/:hid/performances/:pid/provision",   Hosts.provisionPerformanceAccessTokens);
router.post     <string>                ("/hosts/:hid/stripe/connect",                Hosts.connectStripe);
router.get      <IHostStripeInfo>       ("/hosts/:hid/stripe/info",                   Hosts.readStripeInfo);
router.get      <IE<IHostInvoiceStub[]>>("/hosts/:hid/invoices",                      Hosts.readInvoices);
router.get      <IHostInvoice>          ("/hosts/:hid/invoices/:iid",                 Hosts.readInvoice);
router.get      <IRefund[]>             ('/hosts/:hid/invoices/:iid/refunds',         Hosts.readInvoiceRefunds);
router.post     <void>                  ('/hosts/:hid/invoices/process-refunds',      Hosts.processRefunds);
router.post     <void>                  ("/hosts/:hid/invoices/export-csv",           Hosts.exportInvoicesToCSV);
router.post     <void>                  ("/hosts/:hid/invoices/export-pdf",           Hosts.exportInvoicesToPDF);
router.get      <IE<HPatronSub[]>>      ("/hosts/:hid/patronage/subscribers",         Hosts.readPatronageSubscribers);
router.get      <IE<IFollower[]>>       ("/hosts/:hid/followers",                     Hosts.readHostFollowers);
router.get      <DtoHostAnalytics>      ("/hosts/:hid/analytics",                     Hosts.readHostAnalytics);
router.get      <IE<DtoPerfAnalytics[]>>("/hosts/:hid/analytics/performances",        Hosts.readPerformancesAnalytics);

// PATRONAGE ----------------------------------------------------------------------------------------------------------
// const Patronage = Container.get(PATRONAGE_CONTROLLER)
// router.post     <IHostPatronTier>       ("/hosts/:hid/patron-tiers",                  Patronage.createPatronTier);
// router.get      <(IHPTier | IPTier)[]>  ("/hosts/:hid/patron-tiers",                  Patronage.readPatronTiers);
// router.put      <IHostPatronTier>       ("/hosts/:hid/patron-tiers/:tid",             Patronage.updatePatronTier);
// router.delete   <void>                  ("/hosts/:hid/patron-tiers/:tid",             Patronage.deletePatronTier);
// router.post     <IPatronSubscription>   ("/patron-tiers/:tid/subscribe",              Patronage.subscribe);
// router.delete   <void>                  ("/patron-tiers/:tid/unsubscribe",            Patronage.unsubscribe);

// PERFORMANCES -------------------------------------------------------------------------------------------------------
const Perfs = Container.get(PerformanceController)
router.post     <IPerf>                 ("/hosts/:hid/performances",                  Perfs.createPerformance);
router.get      <IE<IPerfS[]>>          ("/performances",                             Perfs.readPerformances);
router.get      <DtoPerformance>        ("/performances/:pid",                        Perfs.readPerformance);
router.put      <void>                  ("/performances/:pid",                        Perfs.softDeletePerformance);
router.put      <void>                  ("/performances/:pid/cancel",                 Perfs.cancelPerformance);
router.put      <IPerf>                 ("/performances/:pid",                        Perfs.updatePerformance);
router.put      <IPerformance>          ("/performances/:pid/publicity-period",       Perfs.updatePublicityPeriod);
router.post     <AssetDto | void>       ("/performances/:pid/thumbnails",             Perfs.changeThumbnails);
router.post     <ICreateAssetRes | void>("/performances/:pid/assets",                 Perfs.createAsset);
router.delete   <void>                  ("/performances/:pid/assets/:aid",            Perfs.deleteAsset);
router.post     <void>                  ("/performances/:pid/assets/:aid/views",      Perfs.registerView);
router.get      <ISignedToken>          ("/performances/:pid/assets/:aid/token",      Perfs.generateSignedToken);
router.get      <ICreateAssetRes>       ("/performances/:pid/assets/:aid/signed-url", Perfs.readVideoAssetSignedUrl);
router.get      <IPHInfo>               ("/performances/:pid/host-info",              Perfs.readPerformanceHostInfo);
router.put      <IPerf>                 ("/performances/:pid/visibility",             Perfs.updateVisibility);
router.get      <IE<ITcktS[], NUUID[]>> ("/performances/:pid/tickets",                Perfs.readTickets);
router.post     <ITicket>               ("/performances/:pid/tickets",                Perfs.createTicket);
router.put      <void>                  ("/performances/:pid/tickets/qty-visibility", Perfs.bulkUpdateTicketQtyVisibility);
router.get      <ITicket>               ("/performances/:pid/tickets/:tid",           Perfs.readTicket);
router.put      <ITicket>               ("/performances/:pid/tickets/:tid",           Perfs.updateTicket);
router.delete   <void>                  ("/performances/:pid/tickets/:tid",           Perfs.deleteTicket);
router.post     <IPaymentICS>           ("/tickets/:tid/payment-intent",              Perfs.createPaymentIntent);
router.post     <void>                  ("/performances/:pid/rate",                   Perfs.setRating);
router.delete   <void>                  ("/performances/:pid/rate",                   Perfs.deleteRating);
router.post     <void>                  ("/performances/:pid/toggle-like",            Perfs.toggleLike);

// SSE ----------------------------------------------------------------------------------------------------------------
const SSE = Container.get(SSEController);
router.get                               ("/sse/assets/:aid",                         SSE.performanceStateEvents);

// SEARCH ---------------------------------------------------------------------------------------------------------------
const Search = Container.get(SearchController);
router.get      <ISearchResponse>        ("/search",                                  Search.search);

// ADMIN  -------------------------------------------------------------------------------------------------------------
const Admin = Container.get(AdminController)
router.get      <IE<IHOnboarding[]>>     ("/admin/onboardings",                       Admin.readOnboardingProcesses);
router.post     <void>                   ("/admin/onboardings/:hid/review",           Admin.reviewOnboardingProcess);

// MUX ----------------------------------------------------------------------------------------------------------------
const MUX = Container.get(MuxController)
router.post     <void>                   ("/mux/hooks",                               MUX.handleHook);

// STRIPE -------------------------------------------------------------------------------------------------------------
const Stripe = Container.get(StripeController)
router.post     <{ received: boolean }>  ("/stripe/hooks",                            Stripe.handleHook);
router.redirect                          ("/stripe/oauth",                            Stripe.handleStripeConnectReturn);

// AUTH ---------------------------------------------------------------------------------------------------------------
const Auth = Container.get(AuthController)
router.redirect                          ("/auth/verify-email",                       Auth.verifyUserEmail);

// GDPR ---------------------------------------------------------------------------------------------------------------
const Gdpr = Container.get(GdprController);
router.get      <IConsentable<CT>>       ("/gdpr/documents/:type/:version",           Gdpr.readLatestDocument);
router.get      <IConsentable<CT>[]>     ("/gdpr/documents/:version",                 Gdpr.readAllLatestDocuments);
router.post     <void>                   ("/gdpr/documents/:type/supersede",          Gdpr.uploadDocument);
router.put     <void>                   ("/gdpr/:hid/:pid/set-stream-compliance",    Gdpr.updateStreamCompliance);

// UTILS ---------------------------------------------------------------------------------------------------------------
const Utils = Container.get(UtilityController);
const Queue = Container.get(JobQueueController);
router.get      <IDynamicFeEnv>          ("/utils/frontend-environment",              Utils.readFrontendEnvironment)
router.post     <void>                   ("/utils/logs",                              Utils.logFrontendMessage);
router.get      <string>                 ("/utils/ping",                              Utils.ping);
router.get      <any>                    ("/utils/seed",                              Utils.seed);
router.post     <void>                   ("/utils/drop",                              Utils.dropAllData);
router.get      <any>                    ("/utils/stats",                             Utils.stats);
router.get      <void>                   ("/utils/send-test-email",                   Utils.sendTestEmail);
router.get      <void>                   ("/utils/assets",                            Utils.readAssets);
router.get      <void>                   ("/utils/assets/:aid/stream-state",          Utils.setPerformanceStreamState)
router.use                               ("/utils/queue-ui",                          Queue.jobQueueUi.handler);
}
