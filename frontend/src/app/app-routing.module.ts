import { Component, NgModule, Type } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { LoggedInGuard, NegateLoggedInGuard } from "./_helpers";

import { IndexComponent } from "./routes/index/index.component";
import { ProfileComponent } from "./routes/profile/profile.component";
import { CatalogComponent } from "./routes/catalog/catalog.component";
import { OrganisationsComponent } from "./routes/organisations/organisations.component";
import { CreateOrgComponent } from "./routes/organisations/create-org/create-org.component";

import { VerifiedComponent } from "./components/pages/verified/verified.component";
import { NotFoundComponent } from "./components/pages/not-found/not-found.component";
import { SpeciesListComponent } from "./routes/catalog/species-list/species-list.component";
import { DashboardComponent } from "./routes/index/dashboard/dashboard.component";

import { DevicesComponent } from "./routes/index/devices/devices.component";
import { DeviceComponent } from "./routes/index/devices/device/device.component";
import { FarmComponent } from "./routes/index/farms/farm/farm.component";
import { FarmsComponent } from "./routes/index/farms/farms.component";
import { RacksComponent } from "./routes/index/farms/racks/racks.component";
import { PropertyListComponent } from "./routes/index/devices/device/property-list/property-list.component";
import { PropAssignmentsComponent } from "./routes/index/devices/device/prop-assignments/prop-assignments.component";
import { DeviceControlComponent } from "./routes/index/devices/device/device-control/device-control.component";
import { ScheduledTasksComponent } from "./routes/index/devices/device/scheduled-tasks/scheduled-tasks.component";
import { DeviceInfoComponent } from "./routes/index/devices/device/device-info/device-info.component";
import { TestbedComponent } from "./ui-lib/testbed/testbed.component";
import { LandingComponent } from "./routes/landing/landing.component";
import { RegisterComponent } from "./routes/landing/register/register.component";
import { LoginComponent } from "./routes/landing/login/login.component";

const APP_ROUTES: Routes = [
  {
    path: "devices",
    component: DevicesComponent,
    children: [
      {
        path: ":did",
        component: DeviceComponent,
        children: [
          {
            path: "",
            component: DeviceInfoComponent,
          },
          {
            path: "properties",
            component: PropAssignmentsComponent,
          },
          {
            path: "measurements",
            component: PropertyListComponent,
          },
          {
            path: "control",
            component: DeviceControlComponent,
          },
          {
            path: "tasks",
            component: ScheduledTasksComponent,
          },
        ],
      },
    ],
  },
  {
    path: "farms",
    component: FarmsComponent,
    children: [
      {
        path: ":fid",
        component: FarmComponent,
        children: [
          {
            path: "racks",
            component: RacksComponent,
          },
          // {
          //   path: "measurements",
          //   component: RacksComponent,
          // },
          // {
          //   path: "agenda",
          //   component: AgendaComponent,
          // },
        ],
      },
    ],
  },
  {
    path: "",
    component: DashboardComponent,
  },
  { path: "ui", component: TestbedComponent },
  {
    path: "verified",
    component: VerifiedComponent,
    canActivate: [LoggedInGuard],
  },
  {
    path: "orgs",
    component: OrganisationsComponent,
    children: [{ path: "create", component: CreateOrgComponent }],
  },
  {
    path: "catalog",
    component: CatalogComponent,
    children: [
      { path: "species", component: SpeciesListComponent },
      { path: "devices", component: SpeciesListComponent },
    ],
  },
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
