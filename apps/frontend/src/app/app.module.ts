import { UnsavedChangesGuard } from './_helpers/UnsavedChanges.guard';
// Modules ----------------------------------------------------------------------------------------------------------------
import { UiLibModule } from './ui-lib/ui-lib.module';
import { AngularMaterialModule } from './angular-material.module';
import { AppRoutingModule } from './app.routes';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { ClickOutsideModule } from 'ng-click-outside';
import { CookieService } from 'ngx-cookie-service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MomentModule } from 'ngx-moment';
import { NgxMaskModule } from 'ngx-mask';
import { NgxPopperModule } from 'ngx-popper';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { NgxPermissionsModule } from 'ngx-permissions';
import { HttpConfigInterceptor } from './_helpers/http.interceptor';
import { NgxStripeModule } from 'ngx-stripe';
import { PlyrModule } from 'ngx-plyr';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { QuillModule } from 'ngx-quill';
import { IvyCarouselModule } from '@frontend/components/libraries/ivyсarousel/carousel.module';
import { BreadcrumbModule, BreadcrumbService } from 'xng-breadcrumb';

// Service ----------------------------------------------------------------------------------------------------------------
import { AppService } from '@frontend/services/app.service';

// https://www.npmjs.com/package/angularx-social-login
import {
  FacebookLoginProvider,
  GoogleLoginProvider,
  SocialAuthServiceConfig,
  SocialLoginModule
} from 'angularx-social-login';

// https://github.com/scttcper/ngx-chartjs
import { ChartjsModule } from '@ctrl/ngx-chartjs';
import {
  LineController,
  LineElement,
  PointElement,
  Chart,
  CategoryScale,
  LinearScale,
  Filler,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
// What you register will depend on what chart you are using and features used.
Chart.register(LineController, LineElement, Filler, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

// Pipes ----------------------------------------------------------------------------------------------------------------
import { OnboardingStatePipe } from './_pipes/onboarding-state.pipe';
import { ObjectLengthPipe } from './_pipes/object-length.pipe';
import { ShortDomainPipe } from './_pipes/short-domain.pipe';
import { OnboardingStepPipe } from './_pipes/onboarding-step.pipe';
import { GdprDocumentTypePipe } from './_pipes/gdpr-document-type.pipe';
import { GenrePipe } from './_pipes/genre.pipe';
import { OptOutReasonPipe } from './_pipes/opt-out-reason.pipe';
import { HostPermissionPipe } from './_pipes/host-permission.pipe';
import { CurrencyCodePipe } from './_pipes/currency-code.pipe';
import { DonoPegPipe } from './_pipes/dono-peg.pipe';
import { PaymentStatusPipe } from './_pipes/payment-status.pipe';
import { TicketTypePipe } from './_pipes/ticket-type.pipe';
import { RefundReasonPipe } from './_pipes/refund-reason.pipe';
import { PaymentMethodBrandName } from './_pipes/payment-method-brand-name.pipe';
import { PatronSubscriptionStatusPipe } from './_pipes/patron-subscription-status.pipe';
import { DeleteHostReasonPipe } from './_pipes/delete-host-reason.pipe';
import { PerformanceStatusPipe } from './_pipes/performance-status.pipe';
import { VisibilityPipe } from './_pipes/visibility.pipe';
import { TimesPipe } from './_pipes/times.pipe';
import { TimeUntilPipe } from './_pipes/time-until.pipe';

// Components ----------------------------------------------------------------------------------------------------------------
import { AdminOnboardingListComponent } from './routes/admin-panel/admin-onboarding-list/admin-onboarding-list.component';
import { AdminOnboardingViewComponent } from './routes/admin-panel/admin-onboarding-view/admin-onboarding-view.component';
import { AdminPanelComponent } from './routes/admin-panel/admin-panel.component';
import { AppComponent } from './app.component';
import { LandingComponent } from './routes/landing/landing.component';
import { LoginComponent } from './routes/landing/login/login.component';
import { ForgotPasswordComponent } from './routes/landing/login/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './routes/landing/login/reset-password/reset-password.component';
import { UserRegisterComponent } from './routes/landing/user-register/user-register.component';
import { VerifiedComponent } from './components/pages/verified/verified.component';
import { NotFoundComponent } from './components/pages/not-found/not-found.component';
import { AppWrapperComponent } from './components/app/wrapper/wrapper.component';
import { HeaderBarComponent } from './components/app/header-bar/header-bar.component';
import { FooterComponent } from './components/app/footer/footer.component';
import { PageComponent } from './components/app/page/page.component';
import { SidebarComponent } from './components/app/sidebar/sidebar.component';
import { FeedComponent } from './routes/feed/feed.component';
import { PerformanceComponent } from './routes/performance/performance.component';
import { PerformanceWatchComponent } from './routes/performance-watch/performance-watch.component';
import { HostPerformancesComponent } from './routes/host/host-performances/host-performances.component';
import { HostComponent } from './routes/host/host.component';
import { CreatePerformanceComponent } from './routes/host/host-performances/create-performance/create-performance.component';
import { PlayerComponent } from './components/player/player.component';
import { ProfileSettingsComponent } from './routes/settings/profile-settings/profile-settings.component';
import { BillingSettingsComponent } from './routes/settings/billing-settings/billing-settings.component';
import { HostSettingsComponent } from './routes/host/host-settings/host-settings.component';
import { CreateHostComponent } from './routes/host/create-host/create-host.component';
import { HostOnboardingComponent } from './routes/host/host-onboarding/host-onboarding.component';
import { SearchComponent } from './routes/search/search.component';
import { OnboardingViewComponent } from './routes/admin-panel/onboarding-view/onboarding-view.component';
import { OnboardingViewIssueMakerComponent } from './routes/admin-panel/onboarding-view/onboarding-view-issue-maker/onboarding-view-issue-maker.component';
import { UserThumbComponent } from './components/user-thumb/user-thumb.component';
import { HostProfileComponent } from './routes/host/host-profile/host-profile.component';
import { HostMembersComponent } from './routes/host/host-members/host-members.component';
import { HostAddMemberComponent } from './routes/host/host-members/host-add-member/host-add-member.component';
import { HostMemberPermissionsDialogComponent } from './routes/host/host-members/host-member-permissions-dialog/host-member-permissions-dialog.component';
import { HostPerformanceComponent } from './routes/host/host-performance/host-performance.component';
import { HostPerformanceDrawerComponent } from './components/app/drawer-components/host-performance-drawer/host-performance-drawer.component';
import { SharePerformanceDialogComponent } from './routes/host/host-performance/share-performance-dialog/share-performance-dialog.component';
import { HostLandingComponent } from './routes/landing/host-landing/host-landing.component';
import { HostDashboardComponent } from './routes/host/host-dashboard/host-dashboard.component';
import { UserTypeClarificationComponent } from './routes/landing/user-type-clarification/user-type-clarification.component';
import { HostPaymentsComponent } from './routes/host/host-payments/host-payments.component';
import { DialogEntryComponent } from './components/dialogs/dialog-entry/dialog-entry.component';
import { RegisterDialogComponent } from './routes/landing/register-dialog/register-dialog.component';
import { ChangeImageComponent } from './components/dialogs/change-image/change-image.component';
import { HostPerformanceTicketingComponent } from './routes/host/host-performance/host-performance-ticketing/host-performance-ticketing.component';
import { HostPerformanceDetailsComponent } from './routes/host/host-performance/host-performance-details/host-performance-details.component';
import { PerformanceBrochureComponent } from './routes/performance/performance-brochure/performance-brochure.component';
import { PerformanceBrochureBannerComponent } from './routes/performance/performance-brochure/performance-brochure-banner/performance-brochure-banner.component';
import { PerformanceBrochureTabsComponent } from './routes/performance/performance-brochure/performance-brochure-tabs/performance-brochure-tabs.component';
import { PerformanceShowComponent } from './routes/performance/performance-show/performance-show.component';
import { PerformanceTicketComponent } from './routes/performance/performance-ticket/performance-ticket.component';
import { MyStuffComponent } from './routes/my-stuff/my-stuff.component';
import { PerformanceThumbComponent } from './components/performance-thumb/performance-thumb.component';
import { SettingsComponent } from './routes/settings/settings.component';
import { CreateUpdateTicketComponent } from './routes/host/host-performance/host-performance-ticketing/create-update-ticket/create-update-ticket.component';
import { HostInvoicesComponent } from './routes/host/host-invoices/host-invoices.component';
import { UploadVideoComponent } from './components/upload-video/upload-video.component';
import { HostPatronageComponent } from './routes/host/host-payments/host-patronage/host-patronage.component';
import { CreateUpdatePatronTierComponent } from './routes/host/host-payments/host-patronage/create-update-patron-tier/create-update-patron-tier.component';
import { PatronTierThumbComponent } from './routes/host/host-payments/host-patronage/patron-tier-thumb/patron-tier-thumb.component';
import { HostProfilePatronageComponent } from './routes/host/host-profile/host-profile-patronage/host-profile-patronage.component';
import { HostProfileAboutComponent } from './routes/host/host-profile/host-profile-about/host-profile-about.component';
import { HostProfileFeedComponent } from './routes/host/host-profile/host-profile-feed/host-profile-feed.component';
import { BecomePatronDialogComponent } from './routes/host/host-profile/host-profile-patronage/become-patron-dialog/become-patron-dialog.component';
import { InvoiceDialogComponent } from './components/dialogs/invoice-dialog/invoice-dialog.component';
import { RefundDialogComponent } from './components/dialogs/refund-dialog/refund-dialog.component';
import { PaymentMethodCollectorComponent } from './components/payment-method/payment-method-collector/payment-method-collector.component';
import { CardComponent } from './components/payment-method/payment-method-collector/card/card.component';
import { PaymentMethodComponent } from './components/payment-method/payment-method.component';
import { PaymentMethodThumbComponent } from './components/payment-method/payment-method-thumb/payment-method-thumb.component';
import { WalletSettingsComponent } from './routes/settings/wallet-settings/wallet-settings.component';
import { GenreFeedComponent } from './routes/feed/genre-feed/genre-feed.component';
import { UserPatronageComponent } from './routes/settings/user-patronage/user-patronage.component';
import { DocumentViewComponent } from './routes/gdpr/document-view/document-view.component';
import { ProcessRefundsDialogComponent } from './components/dialogs/process-refunds-dialog/process-refunds-dialog.component';
import { ConfirmationDialogComponent } from './components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { HostPatronageSubscribersComponent } from './routes/host/host-payments/host-patronage/host-patronage-subscribers/host-patronage-subscribers.component';
import { HostThumbComponent } from './components/host-thumb/host-thumb.component';
import { ContentBoxComponent } from './components/app/content-box/content-box.component';
import { HostDeleteDialogComponent } from './routes/host/host-delete-dialog/host-delete-dialog.component';
import { ConfirmPasswordDialogComponent } from './components/dialogs/confirm-password-dialog/confirm-password-dialog.component';
import { HostPerformanceThumbnailsComponent } from './routes/host/host-performance/host-performance-thumbnails/host-performance-thumbnails.component';
import { SocialSharingComponent } from './components/social-sharing/social-sharing.component';
import { PerformanceDeleteDialogComponent } from './routes/performance/performance-delete-dialog/performance-delete-dialog.component';
import { RatePerformanceComponent } from './components/rate-performance/rate-performance.component';
import { LikeComponent } from './components/like/like.component';
import { RedirectComponent } from './components/redirect/redirect.component';
import { FollowButtonComponent } from './components/follow-button/follow-button.component';
import { HostAnalyticsComponent } from './routes/host/host-analytics/host-analytics.component';
import { HostAnalyticsHeaderItemComponent } from './routes/host/host-analytics/host-analytics-header-item/host-analytics-header-item.component';
import { TermsLinksComponent } from './routes/gdpr/terms-links/terms-links.component';
import { CookieConsentComponent } from './components/cookie-consent/cookie-consent.component';
import { GdprSettingsComponent } from './routes/settings/gdpr-settings/gdpr-settings.component';
import { OptOutDialogComponent } from './components/dialogs/opt-out-dialog/opt-out-dialog.component';
import { AdminGdprDocumentsComponent } from './routes/admin-panel/admin-gdpr-documents/admin-gdpr-documents.component';
import { GdprDocumentUpload } from './components/dialogs/gdpr-document-upload/gdpr-document-upload.component';
import { SelectReasonDialogComponent } from './components/dialogs/select-reason-dialog/select-reason-dialog.component';
import { HostMarketingComponent } from './routes/host/host-marketing/host-marketing.component';
import { HostAudienceListComponent } from './routes/host/host-marketing/host-audience-list/host-audience-list.component';
import { PerformanceCancelDialogComponent } from './routes/performance/performance-cancel-dialog/performance-cancel-dialog.component';
import { HostPerformanceMediaComponent } from './routes/host/host-performance/host-performance-media/host-performance-media.component';
import { HostProfileAssetComponent } from './routes/host/host-profile/host-profile-asset-carousel/host-profile-asset-carousel.component';
import { HostPerformanceDetailsLinksComponent } from './routes/host/host-performance/host-performance-details/host-performance-details-links/host-performance-details-links.component';
import { HostPerformanceDetailsKeysComponent } from './routes/host/host-performance/host-performance-details/host-performance-details-keys/host-performance-details-keys.component';
import { HostPerformanceDetailsVisibilityComponent } from './routes/host/host-performance/host-performance-details/host-performance-details-visibility/host-performance-details-visibility.component';
import { CopyBoxComponent } from './components/copy-box/copy-box.component';
import { HostListPerformancesComponent } from './routes/host/host-performances/list-performances/list-performances.component';
import { BreadcrumbComponent } from './components/app/breadcrumb/breadcrumb.component';
import { OptStatusPipe } from './_pipes/opt-status.pipe';

// Implements factory, so that dynamic environment variables can be loaded before initialising the login providers
const getSigninProviders = async (appService: AppService): Promise<SocialAuthServiceConfig> => {
  const env = await appService.getEnvironment();
  const providers = [
    {
      id: GoogleLoginProvider.PROVIDER_ID,
      provider: new GoogleLoginProvider(env.google_auth_app_id)
    },
    {
      id: FacebookLoginProvider.PROVIDER_ID,
      provider: new FacebookLoginProvider(env.facebook_auth_app_id)
    }
  ];
  return { autoLogin: true, providers };
};

// ---------------------------------------------------------------------------------------------------------------------
@NgModule({
  declarations: [
    AdminOnboardingListComponent,
    AdminOnboardingViewComponent,
    AdminPanelComponent,
    AppComponent,
    DocumentViewComponent,
    LandingComponent,
    LoginComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    VerifiedComponent,
    SettingsComponent,
    HeaderBarComponent,
    AppWrapperComponent,
    NotFoundComponent,
    FooterComponent,
    PageComponent,
    SidebarComponent,
    FeedComponent,
    PerformanceComponent,
    PerformanceWatchComponent,
    HostComponent,
    HostPerformancesComponent,
    CreatePerformanceComponent,
    DocumentViewComponent,
    HostPerformanceThumbnailsComponent,
    PlayerComponent,
    ProfileSettingsComponent,
    SearchComponent,
    AdminOnboardingListComponent,
    HostDashboardComponent,
    OnboardingViewComponent,
    TimesPipe,
    VisibilityPipe,
    GdprDocumentTypePipe,
    GenrePipe,
    OnboardingStatePipe,
    OptOutReasonPipe,
    DeleteHostReasonPipe,
    ObjectLengthPipe,
    ShortDomainPipe,
    PaymentStatusPipe,
    PatronSubscriptionStatusPipe,
    OnboardingStepPipe,
    PaymentMethodBrandName,
    DonoPegPipe,
    HostPermissionPipe,
    PerformanceStatusPipe,
    CurrencyCodePipe,
    TicketTypePipe,
    RefundReasonPipe,
    OnboardingViewIssueMakerComponent,
    PerformanceBrochureComponent,
    PerformanceBrochureBannerComponent,
    PerformanceBrochureTabsComponent,
    PerformanceShowComponent,
    UserThumbComponent,
    HostProfileComponent,
    HostMembersComponent,
    HostAddMemberComponent,
    HostMemberPermissionsDialogComponent,
    HostPerformanceComponent,
    UserTypeClarificationComponent,
    HostPerformanceDrawerComponent,
    ChangeImageComponent,
    SharePerformanceDialogComponent,
    HostLandingComponent,
    HostPaymentsComponent,
    DialogEntryComponent,
    UserRegisterComponent,
    RegisterDialogComponent,
    HostPerformanceTicketingComponent,
    HostPerformanceDetailsComponent,
    CreateUpdateTicketComponent,
    HostPerformanceDetailsComponent,
    PerformanceTicketComponent,
    MyStuffComponent,
    PerformanceThumbComponent,
    BillingSettingsComponent,
    HostSettingsComponent,
    CreateHostComponent,
    HostOnboardingComponent,
    HostInvoicesComponent,
    UploadVideoComponent,
    InvoiceDialogComponent,
    HostPatronageComponent,
    CreateUpdatePatronTierComponent,
    PatronTierThumbComponent,
    HostProfilePatronageComponent,
    HostProfileAboutComponent,
    HostProfileFeedComponent,
    BecomePatronDialogComponent,
    RefundDialogComponent,
    PaymentMethodCollectorComponent,
    CardComponent,
    PaymentMethodComponent,
    PaymentMethodThumbComponent,
    WalletSettingsComponent,
    GenreFeedComponent,
    ProcessRefundsDialogComponent,
    UserPatronageComponent,
    TimeUntilPipe,
    ConfirmationDialogComponent,
    UserPatronageComponent,
    HostPatronageSubscribersComponent,
    ContentBoxComponent,
    HostThumbComponent,
    HostDeleteDialogComponent,
    ConfirmPasswordDialogComponent,
    HostPerformanceThumbnailsComponent,
    SocialSharingComponent,
    PerformanceDeleteDialogComponent,
    RatePerformanceComponent,
    LikeComponent,
    RedirectComponent,
    FollowButtonComponent,
    HostAnalyticsComponent,
    HostAnalyticsHeaderItemComponent,
    CookieConsentComponent,
    SelectReasonDialogComponent,
    TermsLinksComponent,
    CookieConsentComponent,
    PerformanceCancelDialogComponent,
    GdprSettingsComponent,
    OptOutDialogComponent,
    AdminGdprDocumentsComponent,
    GdprDocumentUpload,
    HostPerformanceMediaComponent,
    HostMarketingComponent,
    HostAudienceListComponent,
    HostProfileAssetComponent,
    HostPerformanceDetailsLinksComponent,
    HostPerformanceDetailsKeysComponent,
    CopyBoxComponent,
    HostPerformanceDetailsVisibilityComponent,
    HostListPerformancesComponent,
    BreadcrumbComponent,
    OptStatusPipe
  ],
  imports: [
    AngularMaterialModule,
    UiLibModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    ClickOutsideModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ClickOutsideModule,
    MomentModule,
    ClipboardModule,
    NgxMaskModule.forRoot(),
    NgxPopperModule.forRoot(),
    NgxStripeModule.forRoot(),
    ClipboardModule,
    NgxPermissionsModule.forRoot(),
    PlyrModule,
    IvyCarouselModule,
    ChartjsModule,
    BreadcrumbModule,
    QuillModule.forRoot(),
    LoggerModule.forRoot({
      serverLoggingUrl: '/api/utils/logs',
      colorScheme: ['purple', 'teal', 'gray', 'gray', 'red', 'red', 'red'],
      level: NgxLoggerLevel.TRACE,
      serverLogLevel: NgxLoggerLevel.ERROR
    }),
    SocialLoginModule
  ],
  providers: [
    CookieService,
    BreadcrumbService,
    UnsavedChangesGuard,
    { provide: HTTP_INTERCEPTORS, useClass: HttpConfigInterceptor, multi: true },
    {
      provide: 'SocialAuthServiceConfig',
      useFactory: getSigninProviders,
      deps: [AppService]
    }
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}
