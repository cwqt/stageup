import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { IHostStub, IMyself } from '@core/interfaces';
import { BaseAppService, RouteParam } from '@frontend/services/app.service';
import { PerformanceService } from '@frontend/services/performance.service';
import { filter, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Input() myself: IMyself;

  activeHostPerformanceId: string;
  activeAdmin: boolean;

  constructor(private performanceService: PerformanceService) {}

  get user() {
    return this.myself.user;
  }
  get host(): IHostStub {
    return this.myself.host;
  }

  async ngOnInit() {
    this.performanceService.$activeHostPerformanceId.subscribe(s => (this.activeHostPerformanceId = s));
  }
}
