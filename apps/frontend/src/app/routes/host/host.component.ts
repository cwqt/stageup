import { Component, OnInit } from '@angular/core';
import { IHost } from '@eventi/interfaces';
import { HostService } from 'apps/frontend/src/app/services/host.service';

@Component({
  selector: 'app-host',
  templateUrl: './host.component.html',
  styleUrls: ['./host.component.scss']
})
export class HostComponent implements OnInit {
  host:IHost;

  constructor(private hostService:HostService) {
  }

  ngOnInit(): void {
    this.getHost().then(h => this.host = h);
  }

  getHost():Promise<IHost> {
    return this.hostService.getHost(this.hostService.currentHostValue._id)
  }

}
