import { Component, OnInit } from '@angular/core';
import { DtoPerformance, IHostStub } from '@core/interfaces';
import { ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { AppService } from 'apps/frontend/src/app/services/app.service';
import { DrawerService } from 'apps/frontend/src/app/services/drawer.service';

@Component({
  selector: 'app-host-performance-drawer',
  templateUrl: './host-performance-drawer.component.html',
  styleUrls: ['./host-performance-drawer.component.scss']
})
export class HostPerformanceDrawerComponent implements OnInit {
  data: {
    host: IHostStub;
    performance: ICacheable<DtoPerformance>;
  };

  constructor(private drawerService: DrawerService, private appService: AppService) {}

  get performance() {
    return this.data?.performance.data?.data;
  }
  get host() {
    return this.data?.host;
  }

  ngOnInit(): void {
    this.drawerService.$drawerData.subscribe(d => (this.data = d?.data));
  }

  gotoPerformancesList() {
    this.appService.navigateTo(`/dashboard/events`);
  }
}
