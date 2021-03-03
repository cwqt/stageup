import { Component, OnInit } from '@angular/core';
import { IEnvelopedData, IHostStub, IPerformance, IPerformanceStub, IPerformanceUserInfo } from '@core/interfaces';
import { ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';
import { DrawerService } from 'apps/frontend/src/app/services/drawer.service';

@Component({
  selector: 'app-host-performance-drawer',
  templateUrl: './host-performance-drawer.component.html',
  styleUrls: ['./host-performance-drawer.component.scss']
})
export class HostPerformanceDrawerComponent implements OnInit {
  data: {
    host: IHostStub;
    performance: ICacheable<IEnvelopedData<IPerformance, IPerformanceUserInfo>>;
  };

  constructor(private drawerService: DrawerService, private baseAppService:BaseAppService) {}

  get performance() { return this.data?.performance.data?.data }
  get host() { return this.data?.host }

  ngOnInit(): void {
    this.drawerService.$drawerData.subscribe(d => this.data = d?.data)
  }

  gotoPerformancesList() {
    this.baseAppService.navigateTo(`/dashboard/performances`);
  }
}
