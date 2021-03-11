import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import {
  DtoAccessToken,
  IEnvelopedData,
  IHost,
  IPerformance,
  IPerformanceHostInfo,
} from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { BaseAppService, RouteParam } from 'apps/frontend/src/app/services/app.service';
import { PerformanceService } from 'apps/frontend/src/app/services/performance.service';
import { DrawerKey, DrawerService } from '../../../services/drawer.service';
import { HelperService } from '../../../services/helper.service';
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
  performance: ICacheable<IEnvelopedData<IPerformance, DtoAccessToken>> = createICacheable();
  performanceHostInfo: ICacheable<IPerformanceHostInfo> = createICacheable(null, { is_visible: false });

  onChildLoaded(component: HostPerformanceDetailsComponent | HostPerformanceTicketingComponent) {
    component.performanceId = this.performanceId;
    component.performanceHostInfo = this.performanceHostInfo;
    component.performance = this.performance
    component.host = this.host;
    }


  get performanceData() { return this.performance.data?.data }


  constructor(
    private performanceService: PerformanceService,
    private baseAppService: BaseAppService,
    private drawerService: DrawerService,
    private route: ActivatedRoute,
    private helperService: HelperService,
    private dialog: MatDialog
  ) {}

  async ngOnInit() {
    await this.baseAppService.componentInitialising(this.route);
    this.performanceId = this.baseAppService.getParam(RouteParam.PerformanceId);

    // Immediately fetch the performance & open the drawer with it in a loading state
    // pass by reference the this.performance so the sidebar can await the loading to be completed
    cachize(this.performanceService.readPerformance(this.performanceId), this.performance);
    this.drawerService.setDrawerState({
      key: DrawerKey.HostPerformance,
      data: { host: this.host, performance: this.performance }
    });

    this.drawerService.drawer.open();
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
    this.baseAppService.navigateTo(`/performances/${this.performanceData._id}`);
  }

  ngOnDestroy() {
    this.drawerService.$drawer.value.close();
    this.drawerService.setDrawerState(this.drawerService.drawerData);
  }
}
