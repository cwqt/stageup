import { Component, EventEmitter, Inject, LOCALE_ID, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import {
  DtoPerformance,
  LikeLocation
} from '@core/interfaces';
import { Cacheable, cachize, createICacheable, ICacheable } from '@frontend/app.interfaces';
import { AppService, RouteParam } from '@frontend/services/app.service';
import { PerformanceService } from '@frontend/services/performance.service';
import { IUiDialogOptions } from '@frontend/ui-lib/ui-lib.interfaces';
import { PerformanceBrochureBannerComponent } from '@frontend/routes/performance/performance-brochure/performance-brochure-banner/performance-brochure-banner.component';
import { PerformanceBrochureTabsComponent } from '@frontend/routes/performance/performance-brochure/performance-brochure-tabs/performance-brochure-tabs.component';

@Component({
  selector: 'performance-show',
  templateUrl: './performance-show.component.html',
  styleUrls: ['./performance-show.component.scss']
})
export class PerformanceShowComponent implements OnInit {
  
  @ViewChild('banner') performanceBrochureBanner: PerformanceBrochureBannerComponent;
  @ViewChild('tabs') performanceBrochureTabs: PerformanceBrochureTabsComponent;

  @Output() submit = new EventEmitter();
  @Output() cancel = new EventEmitter();

  @Output() onLike = new EventEmitter();
  @Output() onFollowEvent = new EventEmitter();

  // performanceCacheable: ICacheable<DtoPerformance> = createICacheable();
  performanceCacheable: Cacheable<DtoPerformance> = new Cacheable();
  loading: boolean; // performance & token

  get performance() {
    return this.performanceCacheable.data?.data;
  }

  constructor(
    @Inject(LOCALE_ID) public locale: string,
    private performanceService: PerformanceService,
    private appService: AppService,
    private route: ActivatedRoute,
  ) {}

  async ngOnInit() {
    this.loading = true;
    await this.appService.componentInitialising(this.route);

    await this.performanceCacheable.request(
      this.performanceService.readPerformance(this.appService.getParam(RouteParam.PerformanceId))
    );
  }

  closeDialog() {
    // this.dialog.closeAll();
  }

  async likePerformance() {
    // await this.performanceService.toggleLike(this.data.performance_id, LikeLocation.Brochure);
  }

  likeEvent(value: boolean) {
    // this.onLike.emit(value);
  }
}
