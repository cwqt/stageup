import { Component, OnInit } from '@angular/core';
import { IHost } from '@core/interfaces';
import { HostService } from '../../../services/host.service';

@Component({
  selector: 'app-host-dashboard',
  templateUrl: './host-dashboard.component.html',
  styleUrls: ['./host-dashboard.component.scss']
})
export class HostDashboardComponent implements OnInit {
  host: IHost;

  constructor(private hostService: HostService) {}

  ngOnInit(): void {
    this.host = this.hostService.currentHostValue;
  }
}
