import { Host, NgModule, Type } from "@angular/core";
import { RouterModule, Routes, Route } from "@angular/router";
// import AppRouter from './app.router';

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
import { environment as Env } from "src/environments/environment";
import { PerformanceWatchComponent } from "./routes/performance-watch/performance-watch.component";
import { HostComponent } from "./routes/host/host.component";
import { CatalogComponent } from "./routes/catalog/catalog.component";
import { HostPerformancesComponent } from "./routes/host/host-performances/host-performances.component";
import { HostSettingsComponent } from "./routes/host/host-settings/host-settings.component";
import AppRouter from './app.router';

const APP_ROUTES:Routes = new AppRouter()
  .register(``,                                         FeedComponent,              LoggedInGuard)
  .register(`search`,                                   CatalogComponent,           LoggedInGuard)
  .register(``,                                         FeedComponent,              LoggedInGuard)
  .register(`search`,                                   CatalogComponent,           LoggedInGuard)
  .register(`performance/:${RP.PerformanceId}`,         PerformanceComponent,       LoggedInGuard)
  .register(`watch`,                                    PerformanceWatchComponent,  LoggedInGuard)
  .register(`user/:${RP.UserId}`,                       ProfileComponent,           LoggedInGuard)
  .register(`verified`,                                 VerifiedComponent)
  .pushRouter(r => r.register(`host/:${RP.HostId}`,     HostComponent,              LoggedInGuard))
    .register(`settings`,                               HostSettingsComponent,      null)
    .register(`performances`,                           HostPerformancesComponent,  null)
  .popRouter()
  .register(`ui`,                                       TestbedComponent,            null, !Env.production)
  .apply();

console.log(APP_ROUTES)

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
          children:  APP_ROUTES
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
