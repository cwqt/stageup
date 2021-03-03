// Modules ----------------------------------------------------------------------------------------------------------------
import { BrowserModule } from '@angular/platform-browser';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { UiLibModule } from './ui-lib/ui-lib.module';
import { AngularMaterialModule } from './angular-material.module';
import { AppRoutingModule } from './app.routes';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { NgxMaskModule } from 'ngx-mask';
import { ClickOutsideModule } from 'ng-click-outside';
import { MomentModule } from 'ngx-moment';
import { NgxPopperModule } from 'ngx-popper';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { NgxPermissionsModule } from 'ngx-permissions';
import { HttpConfigInterceptor } from './_helpers/http.interceptor';

// Pipes ----------------------------------------------------------------------------------------------------------------
import { OnboardingStatePipe } from './_pipes/object-state.pipe';
import { ObjectLengthPipe } from './_pipes/object-length.pipe';
import { ShortDomainPipe } from './_pipes/short-domain.pipe';
import { OnboardingStepPipe } from './_pipes/onboarding-step.pipe';
import { HostPermissionPipe } from './_pipes/host-permission.pipe';

// Components ----------------------------------------------------------------------------------------------------------------
import { AppComponent } from './app.component';
import { LandingComponent } from './routes/landing/landing.component';
import { LoginComponent } from './routes/landing/login/login.component';
import { RegisterComponent } from './routes/landing/register/register.component';
import { FirstTimeSetupComponent } from './routes/landing/first-time-setup/first-time-setup.component';
import { VerifiedComponent } from './components/pages/verified/verified.component';
import { NotFoundComponent } from './components/pages/not-found/not-found.component';
import { AppWrapperComponent } from './components/app/wrapper/wrapper.component';
import { HeaderBarComponent } from './components/app/header-bar/header-bar.component';
import { ProfileComponent } from './routes/profile/profile.component';
import { FooterComponent } from './components/app/footer/footer.component';
import { PageComponent } from './components/app/page/page.component';
import { CatalogComponent } from './routes/catalog/catalog.component';
import { SidebarComponent } from './components/app/sidebar/sidebar.component';
import { FeedComponent } from './routes/feed/feed.component';
import { PerformanceComponent } from './routes/performance/performance.component';
import { PerformanceWatchComponent } from './routes/performance-watch/performance-watch.component';
import { HostPerformancesComponent } from './routes/host/host-performances/host-performances.component';
import { HostComponent } from './routes/host/host.component';
import { CreatePerformanceComponent } from './routes/host/host-performances/create-performance/create-performance.component';
import { UpdatePerformanceComponent } from './routes/host/host-performance/update-performance/app-update-performance.component';
import { PlayerComponent } from './components/player/player.component';
import { SettingsComponent } from './routes/settings/settings.component';
import { ProfileSettingsComponent } from './routes/settings/profile-settings/profile-settings.component';
import { BillingSettingsComponent } from './routes/settings/billing-settings/billing-settings.component';
import { AccountSettingsComponent } from './routes/settings/account-settings/account-settings.component';
import { HostSettingsComponent } from './routes/settings/host-settings/host-settings.component';
import { CreateHostComponent } from './routes/settings/host-settings/create-host/create-host.component';
import { HostOnboardingComponent } from './routes/host/host-onboarding/host-onboarding.component';
import { AdminPanelComponent } from './routes/admin-panel/admin-panel.component';
import { AdminOnboardingListComponent } from './routes/admin-panel/admin-onboarding-list/admin-onboarding-list.component';
import { SearchComponent } from './routes/search/search.component';
import { SearchResultsComponent } from './routes/search/search-results/search-results.component';
import { AdminOnboardingViewComponent } from './routes/admin-panel/admin-onboarding-view/admin-onboarding-view.component';
import { OnboardingViewComponent } from './routes/admin-panel/onboarding-view/onboarding-view.component';
import { OnboardingViewIssueMakerComponent } from './routes/admin-panel/onboarding-view/onboarding-view-issue-maker/onboarding-view-issue-maker.component';
import { UserThumbComponent } from './components/user-thumb/user-thumb.component';
import { PerformanceDialogComponent } from './components/dialogs/performance-dialog/performance-dialog.component';
import { HostProfileComponent } from './routes/host/host-profile/host-profile.component';
import { HostContactComponent } from './routes/host/host-contact/host-contact.component';
import { HostAboutComponent } from './routes/host/host-about/host-about.component';
import { HostFeedComponent } from './routes/host/host-feed/host-feed.component';
import { HostMembersComponent } from './routes/host/host-members/host-members.component';
import { HostAddMemberComponent } from './routes/host/host-members/host-add-member/host-add-member.component';
import { HostPerformanceComponent } from './routes/host/host-performance/host-performance.component';
import { HostPerformanceDrawerComponent } from './components/app/drawer-components/host-performance-drawer/host-performance-drawer.component';
import { SharePerformanceDialogComponent } from './routes/host/host-performance/share-performance-dialog/share-performance-dialog.component';
import { HostLandingComponent } from './routes/landing/host-landing/host-landing.component';
import { HostDashboardComponent } from './routes/host/host-dashboard/host-dashboard.component';
import { UserTypeClarificationComponent } from './routes/landing/user-type-clarification/user-type-clarification.component';
import { DialogEntryComponent } from './components/dialogs/dialog-entry/dialog-entry.component';

// ---------------------------------------------------------------------------------------------------------------------

@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    LoginComponent,
    RegisterComponent,
    ProfileComponent,
    VerifiedComponent,
    FirstTimeSetupComponent,
    HeaderBarComponent,
    AppWrapperComponent,
    NotFoundComponent,
    FooterComponent,
    PageComponent,
    CatalogComponent,
    SidebarComponent,
    FeedComponent,
    PerformanceComponent,
    PerformanceWatchComponent,
    HostComponent,
    HostPerformancesComponent,
    CreatePerformanceComponent,
    UpdatePerformanceComponent,
    PlayerComponent,
    SettingsComponent,
    ProfileSettingsComponent,
    BillingSettingsComponent,
    AccountSettingsComponent,
    HostSettingsComponent,
    CreateHostComponent,
    HostOnboardingComponent,
    AdminPanelComponent,
    SearchComponent,
    SearchResultsComponent,
    AdminOnboardingListComponent,
    HostDashboardComponent,
    AdminOnboardingViewComponent,
    OnboardingViewComponent,
    OnboardingStatePipe,
    ObjectLengthPipe,
    ShortDomainPipe,
    OnboardingStepPipe,
    HostPermissionPipe,
    OnboardingViewIssueMakerComponent,
    PerformanceDialogComponent,
    UserThumbComponent,
    HostProfileComponent,
    HostContactComponent,
    HostAboutComponent,
    HostFeedComponent,
    HostMembersComponent,
    HostAddMemberComponent,
    HostPerformanceComponent,
    UserTypeClarificationComponent,
    HostPerformanceDrawerComponent,
    SharePerformanceDialogComponent,
    HostLandingComponent,
    DialogEntryComponent
  ],
  imports: [
    AngularMaterialModule,
    UiLibModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ClickOutsideModule,
    MomentModule,
    ClipboardModule,
    NgxMaskModule.forRoot(),
    NgxPopperModule.forRoot(),
    NgxPermissionsModule.forRoot(),
  ],
  providers: [CookieService, { provide: HTTP_INTERCEPTORS, useClass: HttpConfigInterceptor, multi: true }],
  bootstrap: [AppComponent],
  entryComponents: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}
