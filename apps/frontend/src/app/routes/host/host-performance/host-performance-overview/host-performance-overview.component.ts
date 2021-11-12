import { Component, OnInit } from '@angular/core';
import { RoutesRecognized, Router } from '@angular/router';
import { DtoPerformance, IHost } from '@core/interfaces';
import { ICacheable } from '@frontend/app.interfaces';
import { HostService } from '@frontend/services/host.service';
import { filter, pairwise } from 'rxjs/operators'

@Component({
  selector: 'app-host-performance-overview',
  templateUrl: './host-performance-overview.component.html',
  styleUrls: ['./host-performance-overview.component.scss']
})
export class HostPerformanceOverviewComponent implements OnInit {

  host: IHost;
  numberOfHostEvents: number;

  constructor(private hostService: HostService) { }

  async ngOnInit() {
    const envelope = await this.hostService.readHostPerformances(this.host._id, null);
    // this.numberOfHostEvents = envelope.data.length;
    this.numberOfHostEvents = 1;
  }
}
