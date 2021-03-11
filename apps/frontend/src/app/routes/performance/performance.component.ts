import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DtoAccessToken, IEnvelopedData, IPerformance, IPerformanceUserInfo } from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { BaseAppService, RouteParam } from 'apps/frontend/src/app/services/app.service';
import { PerformanceService } from 'apps/frontend/src/app/services/performance.service';
import { MyselfService } from '../../services/myself.service';

@Component({
  selector: 'app-performance',
  templateUrl: './performance.component.html',
  styleUrls: ['./performance.component.scss']
})
export class PerformanceComponent implements OnInit, OnDestroy {
  performance: ICacheable<IEnvelopedData<IPerformance, DtoAccessToken>> = createICacheable();
  userPerformanceInfo: ICacheable<IPerformanceUserInfo> = createICacheable();

  currencyPrice: string;
  hasAccess: boolean;
  isWatching: boolean;

  constructor(
    private myselfService:MyselfService,
    private performanceService: PerformanceService,
    private route: ActivatedRoute,
    private appService: BaseAppService
  ) {}

  get perf() {
    return this.performance.data?.data;
  }

  async ngOnInit() {
    await this.appService.componentInitialising(this.route);
    await this.getPerformance();

    this.currencyPrice = new Intl.NumberFormat('en-GB', {
      currency: this.perf.currency,
      style: 'currency'
    }).format(this.perf.price);
  }

  onRouterOutletActivate(event) {
    this.isWatching = true;
    this.myselfService.$currentlyWatching.next(this.performance.data);
    //get user token for access
  }

  onRouterOutletDeactivate($event) {
    this.isWatching = false;
    this.myselfService.$currentlyWatching.next(null);
  }

  async getPerformance() {
    return cachize(this.performanceService
      .readPerformance(this.appService.getParam(RouteParam.PerformanceId)), this.performance)
  }

  gotoWatch() {
    this.appService.navigateTo(`performances/${this.perf._id}/watch`);
  }

  gotoFeed() {
    this.appService.navigateTo(`/`);
  }

  ngOnDestroy() {
    this.myselfService.$currentlyWatching.next(null);
  }
}
