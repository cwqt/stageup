import { AdminGdprDocumentsComponent } from './routes/admin-panel/admin-gdpr-documents/admin-gdpr-documents.component';
import { AdminOnboardingListComponent } from './routes/admin-panel/admin-onboarding-list/admin-onboarding-list.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes, UrlMatcher, UrlSegment } from '@angular/router';
import { AppWrapperComponent } from './components/app/wrapper/wrapper.component';
import { DialogEntryComponent } from './components/dialogs/dialog-entry/dialog-entry.component';
import { NotFoundComponent } from './components/pages/not-found/not-found.component';
import { VerifiedComponent } from './components/pages/verified/verified.component';
import { RedirectComponent } from './components/redirect/redirect.component';
import { AdminOnboardingViewComponent } from './routes/admin-panel/admin-onboarding-view/admin-onboarding-view.component';
import { AdminPanelComponent } from './routes/admin-panel/admin-panel.component';
import { FeedComponent } from './routes/feed/feed.component';
import { DocumentViewComponent } from './routes/gdpr/document-view/document-view.component';
import { GenreFeedComponent } from './routes/feed/genre-feed/genre-feed.component';
import { HostAnalyticsComponent } from './routes/host/host-analytics/host-analytics.component';
import { HostDashboardComponent } from './routes/host/host-dashboard/host-dashboard.component';
import { HostMarketingComponent } from './routes/host/host-marketing/host-marketing.component';
import { HostMembersComponent } from './routes/host/host-members/host-members.component';
import { HostPerformanceMediaComponent } from './routes/host/host-performance/host-performance-media/host-performance-media.component';
import { HostOnboardingComponent } from './routes/host/host-onboarding/host-onboarding.component';
import { HostPaymentsComponent } from './routes/host/host-payments/host-payments.component';
import { HostPerformanceDetailsComponent } from './routes/host/host-performance/host-performance-details/host-performance-details.component';
import { HostPerformanceTicketingComponent } from './routes/host/host-performance/host-performance-ticketing/host-performance-ticketing.component';
import { HostPerformanceComponent } from './routes/host/host-performance/host-performance.component';
import { HostPerformancesComponent } from './routes/host/host-performances/host-performances.component';
import { HostProfileAboutComponent } from './routes/host/host-profile/host-profile-about/host-profile-about.component';
import { HostProfileFeedComponent } from './routes/host/host-profile/host-profile-feed/host-profile-feed.component';
import { HostProfilePatronageComponent } from './routes/host/host-profile/host-profile-patronage/host-profile-patronage.component';
import { HostProfileComponent } from './routes/host/host-profile/host-profile.component';
import { HostSettingsComponent } from './routes/host/host-settings/host-settings.component';
import { HostComponent } from './routes/host/host.component';
import { HostLandingComponent } from './routes/landing/host-landing/host-landing.component';
import { ForgotPasswordComponent } from './routes/landing/login/forgot-password/forgot-password.component';
import { LoginComponent } from './routes/landing/login/login.component';
import { ResetPasswordComponent } from './routes/landing/login/reset-password/reset-password.component';
import { RegisterDialogComponent } from './routes/landing/register-dialog/register-dialog.component';
import { MyStuffComponent } from './routes/my-stuff/my-stuff.component';
import { PerformanceComponent } from './routes/performance/performance.component';
import { SearchComponent } from './routes/search/search.component';
import { BillingSettingsComponent } from './routes/settings/billing-settings/billing-settings.component';
import { ProfileSettingsComponent } from './routes/settings/profile-settings/profile-settings.component';
import { SettingsComponent } from './routes/settings/settings.component';
import { RouteParam as RP } from './services/app.service';
import { TestbedComponent } from './ui-lib/testbed/testbed.component';
import { LoggedInGuard } from './_helpers/logged-in.guard';
import { PerformanceShowComponent } from './routes/performance/performance-show/performance-show.component';
import { HostListPerformancesComponent } from './routes/host/host-performances/list-performances/list-performances.component';

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

export interface SidebarData {
  icon: string;
  label: string;
}

const LOGGED_IN_ROUTES: Routes = [
  {
    path: 'my-stuff',
    component: MyStuffComponent
  },
  {
    path: `performances/:${RP.PerformanceId}`,
    component: PerformanceComponent
  },
  { path: `verified`, component: VerifiedComponent },
  {
    path: `settings`,
    component: SettingsComponent,
    children: [
      { path: '', component: ProfileSettingsComponent },
      {
        path: 'payments',
        component: BillingSettingsComponent
      },
      { path: '**', component: NotFoundComponent }
    ]
  },
  {
    path: `dashboard`,
    component: HostComponent,
    children: [
      { path: '', component: HostDashboardComponent },
      { path: 'onboarding', component: HostOnboardingComponent, data: { breadcrumb: $localize`Onboarding` } },
      { path: 'settings', component: HostSettingsComponent, data: { breadcrumb: $localize`Settings` } },
      {
        path: 'payments',
        component: HostPaymentsComponent,
        data: { breadcrumb: $localize`Payments` }
      },
      { path: 'team', component: HostMembersComponent, data: { breadcrumb: $localize`Team` } },
      {
        path: 'performances', component: HostPerformancesComponent, data: { breadcrumb: 'Events' },
        children: [
          { path: '', component: HostListPerformancesComponent },
          {
            path: `:${RP.PerformanceId}`,
            component: HostPerformanceComponent,
            children: [
              { path: '', component: HostPerformanceDetailsComponent, data: { breadcrumb: 'Details' }, },
              { path: 'ticketing', component: HostPerformanceTicketingComponent, data: { breadcrumb: 'Ticketing' } },
              { path: 'media', component: HostPerformanceMediaComponent, data: { breadcrumb: 'Media' } },

              // { path: "analytics", HostPerformanceDetailsComponent },
              { path: '**', component: NotFoundComponent }
            ]
          },
        ],
      },
      { path: 'analytics', component: HostAnalyticsComponent, data: { breadcrumb: 'Analytics' } },
      { path: 'marketing', component: HostMarketingComponent, data: { breadcrumb: 'Marketing' }, },
      {
        matcher: hostMatcher,
        component: HostProfileComponent,
        data: { is_host_view: true },
        children: [
          { path: '', component: HostProfileFeedComponent },
          { path: 'patronage', component: HostProfilePatronageComponent },
          { path: 'about', component: HostProfileAboutComponent },
          { path: '**', component: NotFoundComponent }
        ]
      }
    ]
  },
  {
    path: `admin`,
    component: AdminPanelComponent,
    children: [
      {
        path: '',
        redirectTo: 'onboardings', // '/admin' will redirect to '/admin/onboardings'
        pathMatch: 'full'
      },
      {
        path: `onboardings`,
        component: AdminOnboardingListComponent
      },
      {
        path: `onboardings/:${RP.HostId}`,
        component: DialogEntryComponent,
        data: { open_dialog: AdminOnboardingViewComponent, config: { width: '600px' } }
      },
      {
        path: 'documents',
        component: AdminGdprDocumentsComponent
      }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      [
        { path: `ui`, component: TestbedComponent },
        {
          path: 'host',
          component: HostLandingComponent,
          children: [
            {
              path: 'register',
              component: DialogEntryComponent,
              data: { open_dialog: RegisterDialogComponent, config: { data: { type: 'business' }, width: '600px' } }
            }
          ]
        },
        {
          path: `redirect`,
          component: RedirectComponent
        },
        {
          path: '',
          component: AppWrapperComponent,
          children: [
            { path: 'client', redirectTo: '/' },
            {
              path: `performances/show/:${RP.PerformanceId}`,
              component: PerformanceShowComponent
            },
            {
              path: '',
              component: FeedComponent,
              children: [
                {
                  path: 'login',
                  component: DialogEntryComponent,
                  data: { open_dialog: LoginComponent, config: { width: '600px' } }
                },
                {
                  path: 'register',
                  component: DialogEntryComponent,
                  data: { open_dialog: RegisterDialogComponent, config: { data: { type: 'audience' }, width: '600px' } }
                },
                { path: `users/forgot-password`, component: ForgotPasswordComponent },
                {
                  path: `users/reset-password`,
                  component: DialogEntryComponent,
                  data: { open_dialog: ResetPasswordComponent }
                }
              ]
            },
            {
              path: `genres/:${RP.Genre}`,
              component: GenreFeedComponent
            },
            {
              path: `search`,
              component: SearchComponent
            },
            {
              path: 'documents',
              children: [
                {
                  path: 'terms-and-conditions',
                  component: DocumentViewComponent,
                  data: { document_type: 'general_toc' }
                },
                {
                  path: 'privacy-policy',
                  component: DocumentViewComponent,
                  data: { document_type: 'privacy_policy' }
                },
                { path: '**', component: NotFoundComponent }
              ]
            },
            {
              matcher: hostMatcher,
              component: HostProfileComponent,
              data: { is_host_view: false },
              children: [
                { path: '', component: HostProfileFeedComponent },
                { path: 'patronage', component: HostProfilePatronageComponent },
                { path: 'about', component: HostProfileAboutComponent },
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
        paramsInheritanceStrategy: 'always',
        scrollPositionRestoration: 'enabled'
        // enableTracing: true
      }
    )
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
