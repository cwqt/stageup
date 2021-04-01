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

// Pipes ----------------------------------------------------------------------------------------------------------------
import { OnboardingStatePipe } from './_pipes/object-state.pipe';
import { ObjectLengthPipe } from './_pipes/object-length.pipe';
import { ShortDomainPipe } from './_pipes/short-domain.pipe';
import { OnboardingStepPipe } from './_pipes/onboarding-step.pipe';
import { HostPermissionPipe } from './_pipes/host-permission.pipe';
import { CurrencyCodePipe } from './_pipes/currency-code.pipe';
import { PaymentStatusPipe } from './_pipes/payment-status.pipe';

// Components ----------------------------------------------------------------------------------------------------------------
import { AccountSettingsComponent } from './routes/settings/account-settings/account-settings.component';
import { AdminOnboardingListComponent } from './routes/admin-panel/admin-onboarding-list/admin-onboarding-list.component';
import { AdminOnboardingViewComponent } from './routes/admin-panel/admin-onboarding-view/admin-onboarding-view.component';
import { AdminPanelComponent } from './routes/admin-panel/admin-panel.component';
import { AppComponent } from './app.component';
import { LandingComponent } from './routes/landing/landing.component';
import { LoginComponent } from './routes/landing/login/login.component';
import { UserRegisterComponent } from './routes/landing/user-register/user-register.component';
import { FirstTimeSetupComponent } from './routes/landing/first-time-setup/first-time-setup.component';
import { VerifiedComponent } from './components/pages/verified/verified.component';
import { NotFoundComponent } from './components/pages/not-found/not-found.component';
import { AppWrapperComponent } from './components/app/wrapper/wrapper.component';
import { HeaderBarComponent } from './components/app/header-bar/header-bar.component';
import { ProfileComponent } from './routes/profile/profile.component';
import { FooterComponent } from './components/app/footer/footer.component';
import { PageComponent } from './components/app/page/page.component';
import { SidebarComponent } from './components/app/sidebar/sidebar.component';
import { FeedComponent } from './routes/feed/feed.component';
import { PerformanceComponent } from './routes/performance/performance.component';
import { PerformanceWatchComponent } from './routes/performance-watch/performance-watch.component';
import { HostPerformancesComponent } from './routes/host/host-performances/host-performances.component';
import { HostComponent } from './routes/host/host.component';
import { CreatePerformanceComponent } from './routes/host/host-performances/create-performance/create-performance.component';
import { UpdatePerformanceComponent } from './routes/host/host-performance/update-performance/app-update-performance.component';
import { PlayerComponent } from './components/player/player.component';
import { ProfileSettingsComponent } from './routes/settings/profile-settings/profile-settings.component';
import { BillingSettingsComponent } from './routes/settings/billing-settings/billing-settings.component';
import { HostSettingsComponent } from './routes/settings/host-settings/host-settings.component';
import { CreateHostComponent } from './routes/settings/host-settings/create-host/create-host.component';
import { HostOnboardingComponent } from './routes/host/host-onboarding/host-onboarding.component';
import { SearchComponent } from './routes/search/search.component';
import { OnboardingViewComponent } from './routes/admin-panel/onboarding-view/onboarding-view.component';
import { OnboardingViewIssueMakerComponent } from './routes/admin-panel/onboarding-view/onboarding-view-issue-maker/onboarding-view-issue-maker.component';
import { UserThumbComponent } from './components/user-thumb/user-thumb.component';
import { HostProfileComponent } from './routes/host/host-profile/host-profile.component';
import { HostContactComponent } from './routes/host/host-contact/host-contact.component';
import { HostAboutComponent } from './routes/host/host-about/host-about.component';
import { HostFeedComponent } from './routes/host/host-feed/host-feed.component';
import { HostMembersComponent } from './routes/host/host-members/host-members.component';
import { HostAddMemberComponent } from './routes/host/host-members/host-add-member/host-add-member.component';
import { HostMemberPermissionsDialogComponent } from './routes/host/host-members/host-member-permissions-dialog/host-member-permissions-dialog.component';
import { HostPerformanceComponent } from './routes/host/host-performance/host-performance.component';
import { HostPerformanceDrawerComponent } from './components/app/drawer-components/host-performance-drawer/host-performance-drawer.component';
import { SharePerformanceDialogComponent } from './routes/host/host-performance/share-performance-dialog/share-performance-dialog.component';
import { HostLandingComponent } from './routes/landing/host-landing/host-landing.component';
import { HostDashboardComponent } from './routes/host/host-dashboard/host-dashboard.component';
import { UserTypeClarificationComponent } from './routes/landing/user-type-clarification/user-type-clarification.component';
import { PaymentSuccessComponent } from './routes/payments/payment-success/payment-success.component';
import { PaymentCancelComponent } from './routes/payments/payment-cancel/payment-cancel.component';
import { PaymentCheckoutComponent } from './routes/payments/payment-checkout/payment-checkout.component';
import { environment } from '../environments/environment';
import { HostPaymentsComponent } from './routes/host/host-payments/host-payments.component';
import { DialogEntryComponent } from './components/dialogs/dialog-entry/dialog-entry.component';
import { RegisterDialogComponent } from './routes/landing/register-dialog/register-dialog.component';
import { ChangeImageComponent } from './routes/settings/change-image/change-image.component';
import { HostPerformanceTicketingComponent } from './routes/host/host-performance/host-performance-ticketing/host-performance-ticketing.component';
import { HostPerformanceDetailsComponent } from './routes/host/host-performance/host-performance-details/host-performance-details.component';
import { PerformanceBrochureComponent } from './routes/performance/performance-brochure/performance-brochure.component';
import { PerformanceTicketComponent } from './routes/performance/performance-ticket/performance-ticket.component';
import { MyStuffComponent } from './routes/my-stuff/my-stuff.component';
import { PerformanceThumbComponent } from './components/performance-thumb/performance-thumb.component';
import { DeleteConfirmationDialogComponent } from './components/dialogs/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { SettingsComponent } from './routes/settings/settings.component';
import { CreateUpdateTicketComponent } from './routes/host/host-performance/host-performance-ticketing/create-update-ticket/create-update-ticket.component';
import { HostInvoicesComponent } from './routes/host/host-invoices/host-invoices.component';

// ---------------------------------------------------------------------------------------------------------------------
@NgModule({
  declarations: [
    AccountSettingsComponent,
    AdminOnboardingListComponent,
    AdminOnboardingViewComponent,
    AdminPanelComponent,
    AppComponent,
    LandingComponent,
    DeleteConfirmationDialogComponent,
    LoginComponent,
    ProfileComponent,
    VerifiedComponent,
    SettingsComponent,
    FirstTimeSetupComponent,
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
    UpdatePerformanceComponent,
    PlayerComponent,
    ProfileComponent,
    ProfileSettingsComponent,
    SearchComponent,
    AdminOnboardingListComponent,
    HostDashboardComponent,
    AdminOnboardingViewComponent,
    OnboardingViewComponent,
    OnboardingStatePipe,
    ObjectLengthPipe,
    ShortDomainPipe,
    PaymentStatusPipe,
    OnboardingStepPipe,
    HostPermissionPipe,
    CurrencyCodePipe,
    OnboardingViewIssueMakerComponent,
    PerformanceBrochureComponent,
    UserThumbComponent,
    HostProfileComponent,
    HostContactComponent,
    HostAboutComponent,
    HostFeedComponent,
    HostMembersComponent,
    HostAddMemberComponent,
    HostMemberPermissionsDialogComponent,
    HostPerformanceComponent,
    UserTypeClarificationComponent,
    HostPerformanceDrawerComponent,
    ChangeImageComponent,
    SharePerformanceDialogComponent,
    HostLandingComponent,
    PaymentSuccessComponent,
    PaymentCancelComponent,
    PaymentCheckoutComponent,
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
    HostInvoicesComponent
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
    NgxStripeModule.forRoot(environment.stripePublicKey),
    ClipboardModule,
    NgxPermissionsModule.forRoot(),
    PlyrModule
  ],
  providers: [CookieService, { provide: HTTP_INTERCEPTORS, useClass: HttpConfigInterceptor, multi: true }],
  bootstrap: [AppComponent],
  entryComponents: [DeleteConfirmationDialogComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}
