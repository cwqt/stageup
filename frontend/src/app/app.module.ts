import { CookieService } from "ngx-cookie-service";
import { BrowserModule } from "@angular/platform-browser";
import { NgModule, EventEmitter } from "@angular/core";

import { UiLibModule } from "./ui-lib/ui-lib.module";
import { AngularMaterialModule } from "./angular-material.module";
import { AppRoutingModule } from "./app-routing.module";
import { HighchartsChartModule } from "highcharts-angular";
import { HttpClientModule } from "@angular/common/http";
import { MomentModule } from "ngx-moment";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { DynamicComponentModule, DynamicIoModule } from "ng-dynamic-component";
import { PickerModule } from "@ctrl/ngx-emoji-mart";
import { ClickOutsideModule } from "ng-click-outside";
import { CrystalLightboxModule } from "@crystalui/angular-lightbox";
import { PopoverModule } from "../assets/popover";
import { IvyCarouselModule } from "angular-responsive-carousel";
import { NgxWidgetGridModule } from "ngx-widget-grid";

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

import { DocumentationComponent } from "./routes/documentation/documentation.component";
import { HeaderBarUserMenuComponent } from "./components/app/header-bar/header-bar-user-menu/header-bar-user-menu.component";
import { FooterComponent } from "./components/app/footer/footer.component";
import { TreeNodeComponent } from "./components/graph-selector/tree-node/tree-node.component";
import { IndexComponent } from "./routes/index/index.component";
import { OrganisationsComponent } from "./routes/organisations/organisations.component";
import { PageComponent } from "./components/app/page/page.component";
import { CreateOrgComponent } from "./routes/organisations/create-org/create-org.component";
import { OrganisationComponent } from "./routes/organisations/organisation/organisation.component";
import { HeaderUserButtonComponent } from "./components/app/header-bar/header-user-button/header-user-button.component";

import { CatalogComponent } from "./routes/catalog/catalog.component";
import { SpeciesListComponent } from "./routes/catalog/species-list/species-list.component";
import { DeviceComponent } from "./routes/index/devices/device/device.component";
import { ScheduledTasksComponent } from "./routes/index/devices/device/scheduled-tasks/scheduled-tasks.component";
import { DeviceControlComponent } from "./routes/index/devices/device/device-control/device-control.component";
import { PropertyListComponent } from "./routes/index/devices/device/property-list/property-list.component";
import { DevicesComponent } from "./routes/index/devices/devices.component";
import { FarmsComponent } from "./routes/index/farms/farms.component";
import { FarmComponent } from "./routes/index/farms/farm/farm.component";
import { RackComponent } from "./routes/index/farms/racks/rack/rack.component";
import { CropComponent } from "./routes/index/farms/crop/crop.component";
import { RacksComponent } from "./routes/index/farms/racks/racks.component";
import { PropAssignmentsComponent } from "./routes/index/devices/device/prop-assignments/prop-assignments.component";
import { PropAssignDialogComponent } from "./routes/index/devices/device/prop-assignments/prop-assign-dialog/prop-assign-dialog.component";
import { DeviceMenuComponent } from "./routes/index/devices/device/device-menu/device-menu.component";
import { DeviceInfoComponent } from "./routes/index/devices/device/device-info/device-info.component";

import { DashboardComponent } from "./routes/index/dashboard/dashboard.component";
import { DashboardItemComponent } from "./routes/index/dashboard/dashboard-item/dashboard-item.component";
import { CreateDashItemDialogComponent } from "./routes/index/dashboard/create-dash-item-dialog/create-dash-item-dialog.component";
import { EditDashItemDialogComponent } from "./routes/index/dashboard/dashboard-item/edit-dash-item-dialog/edit-dash-item-dialog.component";

import { DataAggregatorComponent } from "./components/data-aggregator/data-aggregator.component";
import { GraphSelectorComponent } from "./components/graph-selector/graph-selector.component";

import { PickColorComponent } from "./components/pick-color/pick-color.component";
import { PickMeasurementComponent } from "./components/pick-measurement/pick-measurement.component";
import { SideStripComponent } from "./components/app/side-strip/side-strip.component";
import { DataChartComponent } from './components/data-chart/data-chart.component';
import { DataCounterComponent } from "./components/data-counter/data-counter.component";

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
    DeviceComponent,
    DocumentationComponent,
    HeaderBarUserMenuComponent,
    ScheduledTasksComponent,
    DeviceControlComponent,
    DeviceInfoComponent,
    PropAssignmentsComponent,
    FooterComponent,
    PropertyListComponent,
    PropAssignDialogComponent,
    TreeNodeComponent,
    IndexComponent,
    OrganisationsComponent,
    PageComponent,
    CreateOrgComponent,
    DeviceMenuComponent,
    DevicesComponent,
    OrganisationComponent,
    HeaderUserButtonComponent,
    FarmsComponent,
    CatalogComponent,
    SpeciesListComponent,
    DashboardComponent,
    DashboardItemComponent,
    FarmComponent,
    RacksComponent,
    RackComponent,
    CropComponent,
    CreateDashItemDialogComponent,
    EditDashItemDialogComponent,
    DataAggregatorComponent,
    GraphSelectorComponent,
    PickColorComponent,
    PickMeasurementComponent,
    SideStripComponent,
    DataChartComponent,
    DataCounterComponent
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
    DynamicComponentModule,
    DynamicIoModule,
    MomentModule,
    PickerModule,
    ClickOutsideModule,
    CrystalLightboxModule,
    PopoverModule,
    NgxWidgetGridModule,
    HighchartsChartModule,
    IvyCarouselModule,
  ],
  providers: [CookieService],
  entryComponents: [HeaderBarUserMenuComponent],
  bootstrap: [AppComponent],
})
export class AppModule {}
