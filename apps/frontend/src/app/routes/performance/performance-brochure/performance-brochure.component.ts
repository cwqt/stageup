import { Component, EventEmitter, Inject, LOCALE_ID, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  DtoPerformance,
  LikeLocation
} from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from '@frontend/app.interfaces';
import { AppService } from '@frontend/services/app.service';
import { PerformanceService } from '@frontend/services/performance.service';
import { IUiDialogOptions } from '@frontend/ui-lib/ui-lib.interfaces';
import { PerformanceBrochureBannerComponent } from './performance-brochure-banner/performance-brochure-banner.component';
import { PerformanceBrochureTabsComponent } from './performance-brochure-tabs/performance-brochure-tabs.component';

@Component({
  selector: 'performance-brochure',
  templateUrl: './performance-brochure.component.html',
  styleUrls: ['./performance-brochure.component.scss']
})
export class PerformanceBrochureComponent implements OnInit, IUiDialogOptions {
  @ViewChild('banner') performanceBrochureBanner: PerformanceBrochureBannerComponent;
  @ViewChild('tabs') performanceBrochureTabs: PerformanceBrochureTabsComponent;

  @Output() submit = new EventEmitter();
  @Output() cancel = new EventEmitter();

  @Output() onLike = new EventEmitter();
  @Output() onFollowEvent = new EventEmitter();

  performanceCacheable: ICacheable<DtoPerformance> = createICacheable();

  get performance() {
    return this.performanceCacheable.data?.data;
  }

  constructor(
    @Inject(LOCALE_ID) public locale: string,
    private performanceService: PerformanceService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<PerformanceBrochureComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { performance_id: string }
  ) {}

  async ngOnInit() {
    await cachize(this.performanceService.readPerformance(this.data.performance_id), this.performanceCacheable);
  }

  closeDialog() {
    this.dialog.closeAll();
  }

  async likePerformance() {
    await this.performanceService.toggleLike(this.data.performance_id, LikeLocation.Brochure);
  }

  likeEvent(value: boolean) {
    this.onLike.emit(value);
  }
}
