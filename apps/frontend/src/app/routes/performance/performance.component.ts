import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DtoAccessToken, DtoPerformance, IEnvelopedData, IPerformance, IPerformanceUserInfo, JwtAccessToken } from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { BaseAppService, RouteParam } from 'apps/frontend/src/app/services/app.service';
import { PerformanceService } from 'apps/frontend/src/app/services/performance.service';
import { MyselfService } from '../../services/myself.service';

@Component({
  selector: 'app-performance',
  templateUrl: './performance.component.html',
  styleUrls: ['./performance.component.scss']
})
export class PerformanceComponent implements OnInit {
  performance: ICacheable<DtoPerformance> = createICacheable();
  userPerformanceInfo: ICacheable<IPerformanceUserInfo> = createICacheable();

  hasAccess: boolean;

  constructor(
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
}
