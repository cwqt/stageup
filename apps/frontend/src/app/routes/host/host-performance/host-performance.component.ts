import { Clipboard } from '@angular/cdk/clipboard';
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IEnvelopedData,
  IHost,
  IHostStub,
  IPerformance,
  IPerformanceHostInfo,
  IPerformanceUserInfo
} from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { BaseAppService, RouteParam } from 'apps/frontend/src/app/services/app.service';
import { HostService } from 'apps/frontend/src/app/services/host.service';
import { PerformanceService } from 'apps/frontend/src/app/services/performance.service';
import { DrawerKey, DrawerService } from '../../../services/drawer.service';

@Component({
  selector: 'app-host-performance',
  templateUrl: './host-performance.component.html',
  styleUrls: ['./host-performance.component.scss']
})
export class HostPerformanceComponent implements OnInit, OnDestroy {
  host: IHostStub;
  performanceId: string;
  performance: ICacheable<IEnvelopedData<IPerformance, IPerformanceUserInfo>> = createICacheable();
  performanceHostInfo: ICacheable<IPerformanceHostInfo> = createICacheable(null, { is_visible: false });

  copyMessage:string = "Copy";

  get performanceData() {
    return this.performance.data?.data;
  }

  get phiData() {
    return this.performanceHostInfo.data;
  }

  constructor(
    private hostService: HostService,
    private performanceService: PerformanceService,
    private baseAppService: BaseAppService,
    private drawerService: DrawerService,
    private clipboard: Clipboard,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    await this.baseAppService.componentInitialising(this.route);
    this.performanceId = this.baseAppService.getParam(RouteParam.PerformanceId);
    this.host = this.hostService.currentHostValue;

    // Immediately open the drawer with the currently loading performance
    // pass by reference the this.performance so the sidebar can await the loading to be completed
    this.drawerService.setDrawerState({
      key: DrawerKey.HostPerformance,
      data: { host: this.host, performance: this.performance }
    });

    this.drawerService.drawer.open();
    
    // Fetch IPerformance
    cachize(this.performanceService.readPerformance(this.performanceId), this.performance);
  }

  ngOnDestroy() {
    this.drawerService.$drawer.value.close();
    this.drawerService.setDrawerState(this.drawerService.drawerData);
  }

  readStreamingKey() {
    return cachize(this.performanceService.readPerformanceHostInfo(this.performanceId), this.performanceHostInfo);
  }

  copyStreamKeyToClipboard() {
    this.clipboard.copy(this.performanceHostInfo.data.stream_key);

    this.copyMessage = "Copied!";
    setTimeout(() => {
      this.copyMessage = "Copy";
    }, 2000);
  }
}
