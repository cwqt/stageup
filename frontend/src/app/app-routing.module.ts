import { Component, NgModule, Type } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { LoggedInGuard, NegateLoggedInGuard } from "./_helpers";

import { IndexComponent } from "./routes/index/index.component";
import { ProfileComponent } from "./routes/profile/profile.component";
import { CatalogComponent } from "./routes/catalog/catalog.component";
// import { HostComponent } from "./routes/organisations/host.component";

import { VerifiedComponent } from "./components/pages/verified/verified.component";
import { NotFoundComponent } from "./components/pages/not-found/not-found.component";
// import { DashboardComponent } from "./routes/index/dashboard/dashboard.component";

import { TestbedComponent } from "./ui-lib/testbed/testbed.component";
import { LandingComponent } from "./routes/landing/landing.component";
import { RegisterComponent } from "./routes/landing/register/register.component";
import { LoginComponent } from "./routes/landing/login/login.component";
// import { CreateHostComponent } from './routes/organisations/create-host/create-host.component';

const APP_ROUTES: Routes = [
  {
    path: "",
    component: IndexComponent,
  },
  { path: "ui", component: TestbedComponent },
  {
    path: "verified",
    component: VerifiedComponent,
    canActivate: [LoggedInGuard],
  },
  // {
  //   path: "host",
  //   component: HostComponent,
  //   // children: [{ path: "create", component: CreateHostComponent }],
  // },
  {
    path: "user/:username",
    component: ProfileComponent,
    canActivate: [LoggedInGuard],
  }
];

const routes: Routes = [
  { path: "login", component: LoginComponent },
  { path: "register", component: RegisterComponent },
  {
    path: "",
    component: LandingComponent,
    children: APP_ROUTES,
  },
  { path: "**", component: NotFoundComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      // onSameUrlNavigation: "ignore",
      paramsInheritanceStrategy: "always",
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
