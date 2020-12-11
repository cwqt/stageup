import { CookieService } from "ngx-cookie-service";
import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";

import { UiLibModule } from "./ui-lib/ui-lib.module";
import { AngularMaterialModule } from "./angular-material.module";
import { AppRoutingModule } from "./app.routes";
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
import { IndexComponent } from "./routes/index/index.component";

import { HeaderBarUserMenuComponent } from "./components/app/header-bar/header-bar-user-menu/header-bar-user-menu.component";
import { FooterComponent } from "./components/app/footer/footer.component";
import { PageComponent } from "./components/app/page/page.component";
import { HeaderUserButtonComponent } from "./components/app/header-bar/header-user-button/header-user-button.component";

import { CatalogComponent } from "./routes/catalog/catalog.component";
import { SidebarComponent } from './components/app/sidebar/sidebar.component';
import { FeedComponent } from './routes/feed/feed.component';
import { PerformanceComponent } from './routes/performance/performance.component';
import { PerformanceWatchComponent } from './routes/performance-watch/performance-watch.component';
import { HostSettingsComponent } from './routes/host/host-settings/host-settings.component';
import { HostPerformancesComponent } from './routes/host/host-performances/host-performances.component';
import { HostComponent } from './routes/host/host.component';
import { CreatePerformanceComponent } from './routes/host/create-performance/create-performance.component';
import { PlayerComponent } from './components/player/player.component';

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
    HeaderBarUserMenuComponent,
    FooterComponent,
    IndexComponent,
    PageComponent,
    HeaderUserButtonComponent,
    CatalogComponent,
    SidebarComponent,
    FeedComponent,
    PerformanceComponent,
    PerformanceWatchComponent,
    HostComponent,
    HostSettingsComponent,
    HostPerformancesComponent,
    CreatePerformanceComponent,
    PlayerComponent
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
    IvyCarouselModule
  ],
  providers: [CookieService],
  entryComponents: [HeaderBarUserMenuComponent],
  bootstrap: [AppComponent],
})
export class AppModule {}
