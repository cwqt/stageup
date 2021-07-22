import { AfterViewInit, Component, OnInit } from '@angular/core';
import { HostPermission, IHost, IMyself, IEnvelopedData, IUserFollow } from '@core/interfaces';
import { HostService } from 'apps/frontend/src/app/services/host.service';
import { timeStamp } from 'console';
import { Subject, Subscription } from 'rxjs';
import { cachize, createICacheable, ICacheable } from '../../app.interfaces';
import { BaseAppService } from '../../services/app.service';
import { DrawerService } from '../../services/drawer.service';
import { MyselfService } from '../../services/myself.service';

@Component({
  selector: 'app-host',
  templateUrl: './host.component.html',
  styleUrls: ['./host.component.scss']
})
export class HostComponent implements OnInit {
  myself:IMyself;
  host: ICacheable<IEnvelopedData<IHost, IUserFollow>> = createICacheable();

  hostPermission = HostPermission;
  $drawerIsOpen:Subject<boolean>;

  constructor(
    private myselfService:MyselfService,
    private hostService:HostService,
    private baseAppService:BaseAppService,
    private drawerService:DrawerService)
  {}

  ngOnInit(): void {
    this.myselfService.$myself.subscribe(myself => {
      this.myself = myself;
    })

    if(this.myself.host_info.permissions >= HostPermission.Pending) {
      this.baseAppService.navigateTo(`/dashboard`)
    }  

    cachize(this.hostService.readHost(this.myself.host._id), this.host);
    this.$drawerIsOpen = this.drawerService.$drawerOpenInstant;
  }
  

  // Inject IHost into child components
  onOutletLoaded(component) {
    component.host = this.host.data.data;
  }
}
