import { Clipboard } from '@angular/cdk/clipboard';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import {
  IEnvelopedData,
  IHost,
  IPerformance,
  IPerformanceHostInfo,
  IPerformanceUserInfo,
  Visibility
} from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { BaseAppService, RouteParam } from 'apps/frontend/src/app/services/app.service';
import { PerformanceService } from 'apps/frontend/src/app/services/performance.service';
import { DrawerKey, DrawerService } from '../../../services/drawer.service';
import { HelperService } from '../../../services/helper.service';
import { IUiFieldSelectOptions } from '../../../ui-lib/form/form.interfaces';
import { IGraphNode } from '../../../ui-lib/input/input.component';
import { SharePerformanceDialogComponent } from './share-performance-dialog/share-performance-dialog.component';

@Component({
  selector: 'app-host-performance',
  templateUrl: './host-performance.component.html',
  styleUrls: ['./host-performance.component.scss']
})
export class HostPerformanceComponent implements OnInit, OnDestroy {
  host: IHost; // injected from parent router-outlet
  performanceId: string;
  performance: ICacheable<IEnvelopedData<IPerformance, IPerformanceUserInfo>> = createICacheable();
  performanceHostInfo: ICacheable<IPerformanceHostInfo> = createICacheable(null, { is_visible: false });

  copyMessage: string = 'Copy';

  visibilityOptions: IUiFieldSelectOptions = {
    multi: false,
    search: false,
    values: [
      { key: Visibility.Private, value: 'Private' },
      { key: Visibility.Public, value: 'Public' }
    ]
  };

  get performanceData() {
    return this.performance.data?.data;
  }

  get phiData() {
    return this.performanceHostInfo.data;
  }

  constructor(
    private performanceService: PerformanceService,
    private baseAppService: BaseAppService,
    private drawerService: DrawerService,
    private clipboard: Clipboard,
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

  ngOnDestroy() {
    this.drawerService.$drawer.value.close();
    this.drawerService.setDrawerState(this.drawerService.drawerData);
  }

  updateVisibility(value: IGraphNode) {
    cachize(
      this.performanceService.updateVisibility(this.performanceId, value.key as Visibility),
      this.performance,
      d => {
        // updateVisibility only returns an IPerformance but we want to keep having an IE<IPerformance, IPerformanceHostInfo>
        return {
          data: d,
          __client_data: this.performance.data.__client_data
        };
      },
      false
    );
  }

  readStreamingKey() {
    return cachize(this.performanceService.readPerformanceHostInfo(this.performanceId), this.performanceHostInfo);
  }

  copyStreamKeyToClipboard() {
    this.clipboard.copy(this.performanceHostInfo.data.stream_key);

    this.copyMessage = 'Copied!';
    setTimeout(() => {
      this.copyMessage = 'Copy';
    }, 2000);
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
}
