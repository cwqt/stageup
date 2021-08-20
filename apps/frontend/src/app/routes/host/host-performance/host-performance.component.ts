import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { DtoPerformance, IHost, IPerformanceHostInfo } from '@core/interfaces';
import { PerformanceCancelDialogComponent } from '@frontend/routes/performance/performance-cancel-dialog/performance-cancel-dialog.component';
import { PerformanceDeleteDialogComponent } from '@frontend/routes/performance/performance-delete-dialog/performance-delete-dialog.component';
import { cachize, createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { AppService, RouteParam } from 'apps/frontend/src/app/services/app.service';
import { PerformanceService } from 'apps/frontend/src/app/services/performance.service';
import { DrawerKey, DrawerService } from '../../../services/drawer.service';
import { HelperService } from '../../../services/helper.service';
import { HostPerformanceCustomiseComponent } from './host-performance-customise/host-performance-customise.component';
import { HostPerformanceDetailsComponent } from './host-performance-details/host-performance-details.component';
import { HostPerformanceTicketingComponent } from './host-performance-ticketing/host-performance-ticketing.component';
import { SharePerformanceDialogComponent } from './share-performance-dialog/share-performance-dialog.component';

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

  onChildLoaded(
    component: HostPerformanceDetailsComponent | HostPerformanceTicketingComponent | HostPerformanceCustomiseComponent
  ) {
    component.performanceId = this.performanceId;
    component.performanceHostInfo = this.performanceHostInfo;
    component.performance = this.performance;
    component.host = this.host;
  }

  get performanceData() {
    return this.performance.data?.data;
  }

  constructor(
    private performanceService: PerformanceService,
    private appService: AppService,
    private drawerService: DrawerService,
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
    console.log('Data: ', this.performance.data.data);
    this.dialog.open(PerformanceCancelDialogComponent),
      {
        data: this.performance.data.data
      };
  }

  ngOnDestroy() {
    this.performanceService.$activeHostPerformanceId.next(null);
  }
}
