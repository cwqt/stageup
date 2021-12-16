import { Cacheable } from '@frontend/app.interfaces';
import { Subscription } from 'rxjs';
import { HostPerformanceSettingsComponent } from './host-performance-settings/host-performance-settings.component';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DtoPerformance, IHost, IPerformanceHostInfo, PerformanceStatus, PerformanceType } from '@core/interfaces';
import { createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { AppService, RouteParam } from 'apps/frontend/src/app/services/app.service';
import { PerformanceService } from 'apps/frontend/src/app/services/performance.service';
import { HostPerformanceDetailsComponent } from './host-performance-details/host-performance-details.component';
import { HostPerformanceTicketingComponent } from './host-performance-ticketing/host-performance-ticketing.component';
import { HostPerformanceMediaComponent } from './host-performance-media/host-performance-media.component';
import { BreadcrumbService } from 'xng-breadcrumb';

export interface IHostPerformanceComponent {
  host: IHost;
  performanceId: string;
  performanceHostInfo: ICacheable<IPerformanceHostInfo>;
  performance: Cacheable<DtoPerformance>;
}

@Component({
  selector: 'app-host-performance',
  templateUrl: './host-performance.component.html',
  styleUrls: ['./host-performance.component.scss']
})
export class HostPerformanceComponent implements OnInit, OnDestroy {
  host: IHost; // injected from parent router-outlet
  performanceId: string;
  performance = new Cacheable<DtoPerformance>();
  performanceHostInfo: ICacheable<IPerformanceHostInfo> = createICacheable(null, { is_visible: false });
  reloadPerfomanceSubscription: Subscription;

  get performanceIsDraft(): boolean {
    return this.performance?.data?.data?.status === PerformanceStatus.Draft;
  }

  onChildLoaded(
    component:
      | HostPerformanceDetailsComponent
      | HostPerformanceTicketingComponent
      | HostPerformanceMediaComponent
      | HostPerformanceSettingsComponent
  ) {
    component.performanceId = this.performanceId;
    component.performanceHostInfo = this.performanceHostInfo;
    component.performance = this.performance;
    component.host = this.host;
  }

  constructor(
    private performanceService: PerformanceService,
    private appService: AppService,
    private route: ActivatedRoute,
    private breadcrumbService: BreadcrumbService
  ) {}

  async ngOnInit() {
    await this.appService.componentInitialising(this.route);
    this.performanceId = this.appService.getParam(RouteParam.PerformanceId);

    this.performanceService.$activeHostPerformanceId.next(this.performanceId);
    await this.performance.request(this.performanceService.readPerformance(this.performanceId));

    const name = this.performance.data.data.name ? this.performance.data.data.name : 'New Event';
    this.breadcrumbService.set('dashboard/events/:id', name.length > 15 ? `${name.substring(0, 15)}...` : name);
  }

  goToPerformance() {
    this.appService.navigateTo(`/events/${this.performanceId}`);
  }

  ngOnDestroy() {
    this.performanceService.$activeHostPerformanceId.next(null);
  }
}
