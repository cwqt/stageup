import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { IPerformance } from '@core/interfaces';
import { BaseAppService, RouteParam } from 'apps/frontend/src/app/services/app.service';
import { HelperService } from 'apps/frontend/src/app/services/helper.service';
import { HostService } from '../../../services/host.service';
import { CreatePerformanceComponent } from '../create-performance/create-performance.component';

@Component({
  selector: 'app-host-performances',
  templateUrl: './host-performances.component.html',
  styleUrls: ['./host-performances.component.scss']
})
export class HostPerformancesComponent implements OnInit {
  hostId: string;

  constructor(
    private hostService:HostService,
    private helperService: HelperService,
    private dialog: MatDialog
  ) {}

  async ngOnInit() {
    this.hostId = this.hostService.currentHostValue._id;
  }

  openCreatePerformanceDialog() {
    this.helperService.showDialog(
      this.dialog.open(CreatePerformanceComponent, { data: { host_id: this.hostId }, width: '600px' }),
      (perf:IPerformance | null) => {
        // TODO: push to performances list outside 
      }
    );
  }
}
