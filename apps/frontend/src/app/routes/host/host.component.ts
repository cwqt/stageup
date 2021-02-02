import { Component, OnInit } from '@angular/core';
import { IHost, IMyself } from '@eventi/interfaces';
import { HostService } from 'apps/frontend/src/app/services/host.service';
import { MyselfService } from '../../services/myself.service';

@Component({
  selector: 'app-host',
  templateUrl: './host.component.html',
  styleUrls: ['./host.component.scss']
})
export class HostComponent implements OnInit {
  myself:IMyself;
  host:IHost;
  

  constructor(private myselfService:MyselfService, private hostService:HostService) {
  }

  ngOnInit(): void {
    this.myself = this.myselfService.$myself.value;
    this.getHost().then(h => this.host = h);
  }

  getHost():Promise<IHost> {
    return this.hostService.getHost(this.myself.host._id);
  }
}
