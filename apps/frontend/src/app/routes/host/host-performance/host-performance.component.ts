import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { DtoPerformance, IHost, IPerformanceHostInfo, PerformanceStatus } from '@core/interfaces';
import { PerformanceCancelDialogComponent } from '@frontend/routes/performance/performance-cancel-dialog/performance-cancel-dialog.component';
import { PerformanceDeleteDialogComponent } from '@frontend/routes/performance/performance-delete-dialog/performance-delete-dialog.component';
import { getPerformance } from 'apicache';
import { cachize, createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { AppService, RouteParam } from 'apps/frontend/src/app/services/app.service';
import { PerformanceService } from 'apps/frontend/src/app/services/performance.service';
import { DrawerService } from '../../../services/drawer.service';
import { HelperService } from '../../../services/helper.service';
import { HostPerformanceCustomiseComponent } from './host-performance-customise/host-performance-customise.component';
import { HostPerformanceDetailsComponent } from './host-performance-details/host-performance-details.component';
import { HostPerformanceTicketingComponent } from './host-performance-ticketing/host-performance-ticketing.component';
import { SharePerformanceDialogComponent } from './share-performance-dialog/share-performance-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-host-performance',
  templateUrl: './host-performance.component.html',
  styleUrls: ['./host-performance.component.scss']
})
export class HostPerformanceComponent implements OnInit, OnDestroy {
  host: IHost; // injected from parent router-outlet
  performanceId: string;
  performance: ICacheable<DtoPerformance> = createICacheable();
  performanceHostInfo: ICacheable<IPerformanceHostInfo> = createICacheable(null, { is_visible: false });
  disableDeleteButton: boolean;
  disableCancelButton: boolean;
  deletionDisabledTooltip = $localize`Cannot delete a live performance`;
  cancellationDisabledTooltip = $localize`Cannot cancel a live performance`;

  onChildLoaded(
    component: HostPerformanceDetailsComponent | HostPerformanceTicketingComponent | HostPerformanceCustomiseComponent
  ) {
    component.performanceId = this.performanceId;
    component.performanceHostInfo = this.performanceHostInfo;
    component.performance = this.performance;
    component.host = this.host;

    if (this.performance.data.data.status === PerformanceStatus.Live) {
      this.disableCancelButton = true;
      this.disableDeleteButton = true;
    }
  }

  get performanceData() {
    return this.performance.data?.data;
  }

  constructor(
    private performanceService: PerformanceService,
    private appService: AppService,
    private route: ActivatedRoute,
    private helperService: HelperService,
    private dialog: MatDialog
  ) {}

  async ngOnInit() {
    await this.appService.componentInitialising(this.route);
    this.performanceId = this.appService.getParam(RouteParam.PerformanceId);

    this.performanceService.$activeHostPerformanceId.next(this.performanceId);
    cachize(this.performanceService.readPerformance(this.performanceId), this.performance);
  }

  ngAfterContentInit() {
    console.log(this.performance);
  }

  openSharePerformanceDialog() {
    this.helperService.showDialog(
      this.dialog.open(SharePerformanceDialogComponent, {
        data: { host: this.host, performance: this.performanceData }
      }),
      () => {}
    );
  }

  gotoPerformance() {
    this.appService.navigateTo(`/performances/${this.performanceData._id}`);
  }

  deletePerformance() {
    this.dialog.open(PerformanceDeleteDialogComponent, {
      data: this.performance.data.data
    });
  }

  cancelPerformance() {
    this.dialog.open(PerformanceCancelDialogComponent, {
      data: this.performance.data.data
    });
  }

  ngOnDestroy() {
    this.performanceService.$activeHostPerformanceId.next(null);
  }
}
