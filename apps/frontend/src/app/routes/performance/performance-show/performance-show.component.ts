import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import {
  AssetType,
  DtoPerformance,
  LikeLocation
} from '@core/interfaces';
import { Cacheable } from '@frontend/app.interfaces';
import { AppService, RouteParam } from '@frontend/services/app.service';
import { PerformanceService } from '@frontend/services/performance.service';
import { PerformanceBrochureBannerComponent } from '@frontend/routes/performance/performance-brochure/performance-brochure-banner/performance-brochure-banner.component';
import { PerformanceBrochureTabsComponent } from '@frontend/routes/performance/performance-brochure/performance-brochure-tabs/performance-brochure-tabs.component';
import { findAssets } from '@core/helpers';

@Component({
  selector: 'performance-show',
  templateUrl: './performance-show.component.html',
  styleUrls: ['./performance-show.component.scss']
})
export class PerformanceShowComponent implements OnInit, OnDestroy {
  @ViewChild('banner') performanceBrochureBanner: PerformanceBrochureBannerComponent;
  @ViewChild('tabs') performanceBrochureTabs: PerformanceBrochureTabsComponent;

  performanceCacheable: Cacheable<DtoPerformance> = new Cacheable();

  get performance() {
    return this.performanceCacheable.data?.data;
  }

  constructor(
    private performanceService: PerformanceService,
    private appService: AppService,
    private route: ActivatedRoute,
    private meta: Meta
  ) {}

  async ngOnInit() {
    await this.appService.componentInitialising(this.route);
    await this.performanceCacheable.request(
      this.performanceService.readPerformance(this.appService.getParam(RouteParam.PerformanceId))
    );

    this.meta.updateTag({property: 'og:title', content: this.performance.host.name});
    this.meta.updateTag({property: 'og:description', content: this.performance.name});
    let asset: string = '';
    if (findAssets(this.performance.assets, AssetType.Image, ['thumbnail', 'primary'])) {
      asset = findAssets(this.performance.assets, AssetType.Image, ['thumbnail', 'primary'])[0].location;
    } else if (findAssets(this.performance.assets, AssetType.Image, ['primary'])) {
      asset = findAssets(this.performance.assets, AssetType.Image, ['primary'])[0].location;
    } else if (findAssets(this.performance.assets, AssetType.Image, ['secondary'])) {
      asset = findAssets(this.performance.assets, AssetType.Image, ['secondary'])[0].location;
    }
    this.meta.updateTag({
      property: 'og:image',
      content: asset
    });
  }

  leave() {
    this.appService.navigateTo(`/performances/${this.performance._id}`);
  }

  async likePerformance() {
    await this.performanceService.toggleLike(this.performance._id, LikeLocation.Brochure);
  }

  ngOnDestroy() {
    this.meta.updateTag({property: 'og:title', content: ''});
    this.meta.updateTag({property: 'og:description', content: ''});
    this.meta.updateTag({property: 'og:image', content: ''});
  }
}
