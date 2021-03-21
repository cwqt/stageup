import { NgModule } from '@angular/core';
import { RouterModule, Routes, UrlMatcher, UrlSegment } from '@angular/router';
import { LoggedInGuard } from './_helpers/logged-in.guard';
import { RouteParam as RP } from './services/app.service';

import { NotFoundComponent } from './components/pages/not-found/not-found.component';
import { VerifiedComponent } from './components/pages/verified/verified.component';
import { ProfileComponent } from './routes/profile/profile.component';
import { TestbedComponent } from './ui-lib/testbed/testbed.component';
import { RegisterDialogComponent } from './routes/landing/register-dialog/register-dialog.component';
import { LoginComponent } from './routes/landing/login/login.component';
import { FeedComponent } from './routes/feed/feed.component';
import { PerformanceComponent } from './routes/performance/performance.component';
import { PerformanceWatchComponent } from './routes/performance-watch/performance-watch.component';
import { HostComponent } from './routes/host/host.component';
import { HostPerformancesComponent } from './routes/host/host-performances/host-performances.component';
import { SettingsComponent } from './routes/settings/settings.component';
import { ProfileSettingsComponent } from './routes/settings/profile-settings/profile-settings.component';
import { BillingSettingsComponent } from './routes/settings/billing-settings/billing-settings.component';
import { AccountSettingsComponent } from './routes/settings/account-settings/account-settings.component';
import { HostSettingsComponent } from './routes/settings/host-settings/host-settings.component';
import { BillingPaymentComponent } from './routes/settings/billing-settings/billing-payment/billing-payment.component';
import { AdminPanelComponent } from './routes/admin-panel/admin-panel.component';
import { SearchComponent } from './routes/search/search.component';
import { AdminOnboardingViewComponent } from './routes/admin-panel/admin-onboarding-view/admin-onboarding-view.component';
import { AdminOnboardingListComponent } from './routes/admin-panel/admin-onboarding-list/admin-onboarding-list.component';
import { HostOnboardingComponent } from './routes/host/host-onboarding/host-onboarding.component';
import { HostProfileComponent } from './routes/host/host-profile/host-profile.component';
import { HostAboutComponent } from './routes/host/host-about/host-about.component';
import { HostContactComponent } from './routes/host/host-contact/host-contact.component';
import { HostFeedComponent } from './routes/host/host-feed/host-feed.component';
import { HostMembersComponent } from './routes/host/host-members/host-members.component';
import { HostPerformanceComponent } from './routes/host/host-performance/host-performance.component';
import { HostDashboardComponent } from './routes/host/host-dashboard/host-dashboard.component';
import { HostLandingComponent } from './routes/landing/host-landing/host-landing.component';
import { AppWrapperComponent } from './components/app/wrapper/wrapper.component';
import { PaymentSuccessComponent } from './routes/payments/payment-success/payment-success.component';
import { PaymentCancelComponent } from './routes/payments/payment-cancel/payment-cancel.component';
import { PaymentCheckoutComponent } from './routes/payments/payment-checkout/payment-checkout.component';
import { HostPaymentsComponent } from './routes/host/host-payments/host-payments.component';
import { DialogEntryComponent } from './components/dialogs/dialog-entry/dialog-entry.component';
import { HostPerformanceDetailsComponent } from './routes/host/host-performance/host-performance-details/host-performance-details.component';
import { HostPerformanceTicketingComponent } from './routes/host/host-performance/host-performance-ticketing/host-performance-ticketing.component';

// Custom matcher to match a wildcard for host pages - http://url/@hostId
const hostMatcher: UrlMatcher = (segments: UrlSegment[]) => {
  const first = segments[0];

  if (first?.path.match(/^@.*$/)) {
    return {
      consumed: [first],
      posParams: {
        [RP.HostId]: first
      }
    };
  }

  return null;
};

const LOGGED_IN_ROUTES: Routes = [
  {
    path: `performances/:${RP.PerformanceId}`,
    component: PerformanceComponent,
    children: [{ path: 'watch', component: PerformanceWatchComponent }]
  },
  { path: `user/:${RP.UserId}`, component: ProfileComponent },
  { path: `verified`, component: VerifiedComponent },
  {
    path: `settings`,
    component: SettingsComponent,
    children: [
      { path: '', component: ProfileSettingsComponent },
      {
        path: 'billing',
        component: BillingSettingsComponent,
        children: [{ path: 'payment', component: BillingPaymentComponent }]
      },
      { path: 'host', component: HostSettingsComponent },
      { path: 'account', component: AccountSettingsComponent },
      { path: '**', component: NotFoundComponent }
    ]
  },
  {
    path: `dashboard`,
    component: HostComponent,
    children: [
      { path: '', component: HostDashboardComponent },
      { path: 'onboarding', component: HostOnboardingComponent },
      { path: 'settings', component: HostSettingsComponent },
      { path: 'payments', component: HostPaymentsComponent },
      { path: 'team', component: HostMembersComponent },
      { path: 'performances', component: HostPerformancesComponent },
      {
        path: `performances/:${RP.PerformanceId}`,
        component: HostPerformanceComponent,
        children: [
          { path: '', component: HostPerformanceDetailsComponent },
          { path: 'ticketing', component: HostPerformanceTicketingComponent },
          // { path: "analytics", HostPerformanceDetailsComponent },
          { path: '**', component: NotFoundComponent }
        ]
      },
      {
        matcher: hostMatcher,
        component: HostProfileComponent,
        data: { is_host_view: true },
        children: [
          { path: '', component: HostFeedComponent },
          { path: 'about', component: HostAboutComponent },
          { path: 'contact', component: HostContactComponent },
          { path: '**', component: NotFoundComponent }
        ]
      }
    ]
  },
  {
    path: 'payments',
    children: [
      { path: 'checkout', component: PaymentCheckoutComponent },
      { path: 'success', component: PaymentSuccessComponent },
      { path: 'cancel', component: PaymentCancelComponent }
    ]
  },
  { path: `admin`, component: AdminPanelComponent },
  { path: `admin/onboardings`, component: AdminOnboardingListComponent },
  { path: `admin/onboardings/:${RP.HostId}`, component: AdminOnboardingViewComponent },
  { path: `ui`, component: TestbedComponent }
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      [
        {
          path: 'host',
          component: HostLandingComponent,
          children: [
            {
              path: 'register',
              component: DialogEntryComponent,
              data: { open_dialog: RegisterDialogComponent, config: { data: { type: 'business' } } }
            }
          ]
        },
        {
          path: '',
          component: AppWrapperComponent,
          children: [
            { path: 'client', redirectTo: '/' },
            {
              path: '',
              component: FeedComponent,
              children: [
                {
                  path: 'login',
                  component: DialogEntryComponent,
                  data: { open_dialog: LoginComponent }
                },
                {
                  path: 'register',
                  component: DialogEntryComponent,
                  data: { open_dialog: RegisterDialogComponent, config: { data: { type: 'audience' } } }
                }
              ]
            },
            {
              path: `search`,
              component: SearchComponent
            },
            {
              matcher: hostMatcher,
              component: HostProfileComponent,
              data: { is_host_view: false },
              children: [
                { path: '', component: HostFeedComponent },
                { path: 'about', component: HostAboutComponent },
                { path: 'contact', component: HostContactComponent },
                { path: '**', component: NotFoundComponent }
              ]
            },
            {
              path: '',
              canActivate: [LoggedInGuard],
              children: LOGGED_IN_ROUTES
            },
            { path: '**', component: NotFoundComponent }
          ]
        }
      ],
      {
        onSameUrlNavigation: 'reload',
        paramsInheritanceStrategy: 'always'
        // enableTracing: true
      }
    )
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
