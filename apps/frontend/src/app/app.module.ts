import { BrowserModule } from "@angular/platform-browser";
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

import { UiLibModule } from "./ui-lib/ui-lib.module";
import { AngularMaterialModule } from "./angular-material.module";
import { AppRoutingModule } from "./app.routes";
import { HttpClientModule } from "@angular/common/http";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CookieService } from "ngx-cookie-service";
import { NgxMaskModule, IConfig } from 'ngx-mask'

import { ClickOutsideModule } from "ng-click-outside";
import { MomentModule } from 'ngx-moment';

import { AppComponent } from "./app.component";
import { LandingComponent } from "./routes/landing/landing.component";
import { LoginComponent } from "./routes/landing/login/login.component";
import { RegisterComponent } from "./routes/landing/register/register.component";
import { FirstTimeSetupComponent } from "./routes/landing/first-time-setup/first-time-setup.component";
import { VerifiedComponent } from "./components/pages/verified/verified.component";
import { NotFoundComponent } from "./components/pages/not-found/not-found.component";

import { WrapperComponent } from "./components/app/wrapper/wrapper.component";
import { HeaderBarComponent } from "./components/app/header-bar/header-bar.component";

import { ProfileComponent } from "./routes/profile/profile.component";
import { IndexComponent } from "./routes/index/index.component";

import { FooterComponent } from "./components/app/footer/footer.component";
import { PageComponent } from "./components/app/page/page.component";

import { CatalogComponent } from "./routes/catalog/catalog.component";
import { SidebarComponent } from "./components/app/sidebar/sidebar.component";
import { FeedComponent } from "./routes/feed/feed.component";
import { PerformanceComponent } from "./routes/performance/performance.component";
import { PerformanceWatchComponent } from "./routes/performance-watch/performance-watch.component";
import { HostPerformancesComponent } from "./routes/host/host-performances/host-performances.component";
import { HostComponent } from "./routes/host/host.component";
import { CreatePerformanceComponent } from "./routes/host/create-performance/create-performance.component";
import { PlayerComponent } from "./components/player/player.component";
import { SettingsComponent } from "./routes/settings/settings.component";
import { ProfileSettingsComponent } from "./routes/settings/profile-settings/profile-settings.component";
import { BillingSettingsComponent } from "./routes/settings/billing-settings/billing-settings.component";
import { AccountSettingsComponent } from "./routes/settings/account-settings/account-settings.component";
import { HostSettingsComponent } from "./routes/settings/host-settings/host-settings.component";
import { CreateHostComponent } from "./routes/settings/host-settings/create-host/create-host.component";
import { HostOnboardingComponent } from "./routes/host/host-onboarding/host-onboarding.component";
import { AdminPanelComponent } from "./routes/admin-panel/admin-panel.component";
import { AdminOnboardingListComponent } from './routes/admin-panel/admin-onboarding-list/admin-onboarding-list.component';
import { SearchComponent } from "./routes/search/search.component";
import { OnboardingStatePipe } from "./_pipes/OnboardingStatePipe";
import { AdminOnboardingViewComponent } from './routes/admin-panel/admin-onboarding-view/admin-onboarding-view.component';
import { OnboardingViewComponent } from './routes/admin-panel/onboarding-view/onboarding-view.component';
import { ObjectLengthPipe } from "./_pipes/ObjectLengthPipe";

import { PerformanceModalComponent } from './components/modals/performance-modal.component';

export const maskOptions: Partial<IConfig> | (() => Partial<IConfig>) = null;


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
    WrapperComponent,
    NotFoundComponent,
    FooterComponent,
    IndexComponent,
    PageComponent,
    CatalogComponent,
    SidebarComponent,
    FeedComponent,
    PerformanceComponent,
    PerformanceWatchComponent,
    HostComponent,
    HostPerformancesComponent,
    CreatePerformanceComponent,
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
    AdminOnboardingListComponent,
    OnboardingStatePipe,
    AdminOnboardingViewComponent,
    OnboardingViewComponent,
    ObjectLengthPipe,
    PerformanceModalComponent
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
    NgxMaskModule.forRoot(),
    MomentModule
  ],
  providers: [
    CookieService,
  ],
  entryComponents: [PerformanceModalComponent],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}
