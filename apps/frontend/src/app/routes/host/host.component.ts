import { Component, OnInit } from '@angular/core';
import { HostPermission, IHost, IMyself } from '@core/interfaces';
import { HostService } from 'apps/frontend/src/app/services/host.service';
import { timeStamp } from 'console';
import { BaseAppService } from '../../services/app.service';
import { MyselfService } from '../../services/myself.service';

@Component({
  selector: 'app-host',
  templateUrl: './host.component.html',
  styleUrls: ['./host.component.scss']
})
export class HostComponent implements OnInit {
  myself:IMyself;
  host:IHost;

  host_permission = HostPermission;
  

  constructor(private myselfService:MyselfService, private hostService:HostService, private baseAppService:BaseAppService) {
  }

  ngOnInit(): void {
    this.myself = this.myselfService.$myself.value;
    if(this.myself.host_info.permissions >= HostPermission.Pending) {
      this.baseAppService.navigateTo(`/host`)
    }
    this.getHost().then(h => this.host = h);
  }

  getHost():Promise<IHost> {
    return this.hostService.readHost(this.myself.host._id);
  }
}
