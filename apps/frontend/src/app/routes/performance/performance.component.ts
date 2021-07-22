import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  DtoAccessToken,
  DtoPerformance,
  IAssetStub,
  IEnvelopedData,
  IPerformance,
  IPerformanceUserInfo,
  AssetType,
  ISignedToken
} from '@core/interfaces';
import { Cacheable } from 'apps/frontend/src/app/app.interfaces';
import { BaseAppService, RouteParam } from 'apps/frontend/src/app/services/app.service';
import { PerformanceService } from 'apps/frontend/src/app/services/performance.service';
import { merge, Observable } from 'rxjs';

@Component({
  selector: 'app-performance',
  templateUrl: './performance.component.html',
  styleUrls: ['./performance.component.scss']
})
export class PerformanceComponent implements OnInit {
  $loading: Observable<boolean>;
  performance: Cacheable<DtoPerformance> = new Cacheable();
  primaryAsset: IAssetStub<AssetType.Video | AssetType.LiveStream>;
  primarySignedToken: Cacheable<ISignedToken> = new Cacheable();

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
    this.$loading = merge(this.performance.$loading, this.primarySignedToken.$loading);

    await this.performance.request(
      this.performanceService.readPerformance(this.appService.getParam(RouteParam.PerformanceId))
    );

    this.primaryAsset = this.perf.assets.find(asset => asset.tags.includes('primary'));
    if (this.primaryAsset)
      await this.primarySignedToken.request(
        this.performanceService.generateSignedToken(this.performance.data.data._id, this.primaryAsset._id)
      );
  }

  gotoFeed() {
    this.appService.navigateTo(`/`);
  }
}
