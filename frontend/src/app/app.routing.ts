import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import AppRouter from './app.router';

import { LoggedInGuard } from "./_helpers";

import { ProfileComponent } from "./routes/profile/profile.component";

import { VerifiedComponent } from "./components/pages/verified/verified.component";
import { NotFoundComponent } from "./components/pages/not-found/not-found.component";

import { TestbedComponent } from "./ui-lib/testbed/testbed.component";
import { LandingComponent } from "./routes/landing/landing.component";
import { RegisterComponent } from "./routes/landing/register/register.component";
import { LoginComponent } from "./routes/landing/login/login.component";
import { FeedComponent } from "./routes/feed/feed.component";
import { PerformanceComponent } from './routes/performance/performance.component';
import { RouteParam as RP} from './services/app.service';
import { environment as Env } from 'src/environments/environment';
import { PerformanceWatchComponent } from './routes/performance-watch/performance-watch.component';
import { HostComponent } from './routes/host/host.component';
import { CatalogComponent } from './routes/catalog/catalog.component';

const R = new AppRouter();

R.register(``,                                                  FeedComponent,              LoggedInGuard);
R.register(`search`,                                            CatalogComponent,           LoggedInGuard);
// R.register(`library`,                                           LibraryComponent,           LoggedInGuard);
R.register(`performance/:${RP.PerformanceId}`,                  PerformanceComponent,       LoggedInGuard);
R.register(`watch`,                                             PerformanceWatchComponent,  LoggedInGuard);
R.register(`user/@:${RP.UserId}`,                               ProfileComponent,           LoggedInGuard);
R.register(`host/@:${RP.HostId}`,                               HostComponent,              LoggedInGuard);
R.register(`verified`,                                          VerifiedComponent);
R.register(`ui`,                                                TestbedComponent,           null, !Env.production);

@NgModule({
  imports: [
    RouterModule.forRoot(
      [
        // Use two routers - one for external, non-logged in users
        // and another for internal logged in users
        { path: "login",    component: LoginComponent },
        { path: "register", component: RegisterComponent },
        {
          path: "",
          component: LandingComponent,
          children:  R.routes
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
