import { NumberFormatStyle } from "@angular/common";
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { IPerformance, IPerformancePurchase, IPerformanceUserInfo } from "@eventi/interfaces";
import { ICacheable } from "apps/frontend/src/app/app.interfaces";
import { BaseAppService, RouteParam } from "apps/frontend/src/app/services/app.service";
import { PerformanceService } from "apps/frontend/src/app/services/performance.service";

@Component({
  selector: "app-performance",
  templateUrl: "./performance.component.html",
  styleUrls: ["./performance.component.scss"],
})
export class PerformanceComponent implements OnInit {
  performance: ICacheable<IPerformance> = {
    data: null,
    loading: false,
    error: null,
  };

  userPerformanceInfo:ICacheable<IPerformanceUserInfo> = {
    data: null,
    loading: false,
    error: null
  };

  currencyPrice: string;
  hasAccess:boolean;
  isWatching:boolean;

  constructor(
    private performanceService: PerformanceService,
    private router: Router,
    private route: ActivatedRoute,
    private appService: BaseAppService
  ) {}

  get perf() {
    return this.performance.data;
  }

  async ngOnInit() {
    await this.appService.componentInitialising(this.route);
    await this.getPerformance();
    
    this.currencyPrice = new Intl.NumberFormat("en-GB", {
      currency: this.perf.currency,
      style: "currency",
    }).format(this.perf.price);

    this.appService.$routeAltered.subscribe(o => console.log(o))
  }

  onRouterOutletActivate(event) {
    this.isWatching = true;
    //get user token for access
  }

  onRouterOutletDeactivate($event) {
    this.isWatching = false;
  }

  async getPerformance() {
    this.performance.loading = true;
    return this.performanceService
      .getPerformance(
        parseInt(this.appService.getParam(RouteParam.PerformanceId))
      )
      .then((p:IPerformance) => (this.performance.data = p))
      .catch((e:HttpErrorResponse) => (this.performance.error = e.message))
      .finally(() => (this.performance.loading = false));
  }

  gotoWatch() {
    this.appService.navigateTo(`performance/${this.perf._id}/watch`)
  }
}
