import { AfterViewInit, Component, OnInit } from '@angular/core';
import { HostPermission, IHost, IMyself, IEnvelopedData, IClientHostData, DtoReadHost } from '@core/interfaces';
import { HostService } from 'apps/frontend/src/app/services/host.service';
import { timeStamp } from 'console';
import { Subject, Subscription } from 'rxjs';
import { cachize, createICacheable, ICacheable } from '../../app.interfaces';
import { AppService } from '../../services/app.service';
import { DrawerService } from '../../services/drawer.service';
import { MyselfService } from '../../services/myself.service';
import { BreadcrumbService } from 'xng-breadcrumb';

@Component({
  selector: 'app-host',
  templateUrl: './host.component.html',
  styleUrls: ['./host.component.scss']
})
export class HostComponent implements OnInit {
  myself: IMyself;
  host: ICacheable<DtoReadHost> = createICacheable();

  hostPermission = HostPermission;
  $drawerIsOpen: Subject<boolean>;

  constructor(
    private myselfService: MyselfService,
    private hostService: HostService,
    private appService: AppService,
    private drawerService: DrawerService,
    private breadcrumbService: BreadcrumbService
  ) {}

  ngOnInit(): void {
    this.myselfService.$myself.subscribe(myself => {
      this.myself = myself;
    });

    if (this.myself.host_info.permissions >= HostPermission.Pending) {
      this.appService.navigateTo(`/dashboard`);
    }

    cachize(this.hostService.readHost(this.myself.host._id), this.host);
    this.$drawerIsOpen = this.drawerService.$drawerOpenInstant;
    this.breadcrumbService.set('dashboard', this.myself.host.name);
  }

  // Inject IHost into child components
  onOutletLoaded(component) {
    component.host = this.host.data.data;
  }
}
