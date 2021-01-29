import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { LoggedInGuard } from "./_helpers";

import { ProfileComponent } from "./routes/profile/profile.component";

import { VerifiedComponent } from "./components/pages/verified/verified.component";
import { NotFoundComponent } from "./components/pages/not-found/not-found.component";

import { TestbedComponent } from "./ui-lib/testbed/testbed.component";
import { LandingComponent } from "./routes/landing/landing.component";
import { RegisterComponent } from "./routes/landing/register/register.component";
import { LoginComponent } from "./routes/landing/login/login.component";
import { FeedComponent } from "./routes/feed/feed.component";
import { PerformanceComponent } from "./routes/performance/performance.component";
import { RouteParam as RP } from "./services/app.service";
import { PerformanceWatchComponent } from "./routes/performance-watch/performance-watch.component";
import { HostComponent } from "./routes/host/host.component";
import { HostPerformancesComponent } from "./routes/host/host-performances/host-performances.component";
import { SettingsComponent } from "./routes/settings/settings.component";
import { ProfileSettingsComponent } from "./routes/settings/profile-settings/profile-settings.component";
import { BillingSettingsComponent } from "./routes/settings/billing-settings/billing-settings.component";
import { AccountSettingsComponent } from "./routes/settings/account-settings/account-settings.component";
import { HostSettingsComponent } from "./routes/settings/host-settings/host-settings.component";
import { BillingPaymentComponent } from "./routes/settings/billing-settings/billing-payment/billing-payment.component";
import { AdminPanelComponent } from "./routes/admin-panel/admin-panel.component";
import { SearchComponent } from "./routes/search/search.component";
import { AdminOnboardingViewComponent } from "./routes/admin-panel/admin-onboarding-view/admin-onboarding-view.component";

const APP_ROUTES: Routes = [
  { path: "", component: FeedComponent },
  { path: "search", component: SearchComponent },
  {
    path: `performance/:${RP.PerformanceId}`,
    component: PerformanceComponent,
    children: [{ path: "watch", component: PerformanceWatchComponent }],
  },
  { path: `user/:${RP.UserId}`, component: ProfileComponent },
  { path: `verified`, component: VerifiedComponent },
  {
    path: `settings`,
    component: SettingsComponent,
    children: [
      { path: "profile", component: ProfileSettingsComponent },
      {
        path: "billing",
        component: BillingSettingsComponent,
        children: [{ path: "payment", component: BillingPaymentComponent }],
      },
      { path: "host", component: HostSettingsComponent },
      { path: "account", component: AccountSettingsComponent },
    ],
  },
  {
    path: `host`,
    component: HostComponent,
    children: [
      { path: "settings", component: HostSettingsComponent },
      { path: "performance", component: HostPerformancesComponent },
    ],
  },
  { path: `admin`, component: AdminPanelComponent },
  { path: `admin/onboarding/:${RP.HostId}`, component: AdminOnboardingViewComponent},
  { path: `ui`, component: TestbedComponent },
  { path: "**", component: NotFoundComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      [
        // Use two routers - one for external, non-logged in users
        // and another for internal logged in users
        { path: "login", component: LoginComponent },
        { path: "register", component: RegisterComponent },
        {
          path: "",
          component: LandingComponent,
          children: APP_ROUTES,
          // canActivateChild: [LoggedInGuard]
        },
        { path: "**", component: NotFoundComponent },
      ],
      {
        // onSameUrlNavigation: "ignore",
        paramsInheritanceStrategy: "always",
      }
    ),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
