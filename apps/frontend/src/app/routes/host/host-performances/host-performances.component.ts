import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaseAppService, RouteParam } from 'apps/frontend/src/app/services/app.service';

@Component({
  selector: 'app-host-performances',
  templateUrl: './host-performances.component.html',
  styleUrls: ['./host-performances.component.scss']
})
export class HostPerformancesComponent implements OnInit {
  hostId:number;x

  constructor(private appService:BaseAppService, private route:ActivatedRoute, ) { }

  async ngOnInit() {
    await this.appService.componentInitialising(this.route, false);
    this.hostId = parseInt(this.appService.getParam(RouteParam.HostId));
  }
}
