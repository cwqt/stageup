import { Component, LOCALE_ID, OnInit, Inject } from '@angular/core';
import { DtoPerformance, IHost, PerformanceStatus } from '@core/interfaces';
import { of } from 'rxjs';
import { formatDate } from "@angular/common";
import { ICacheable } from '@frontend/app.interfaces';
import { AppService } from '@frontend/services/app.service';
import { HostService } from '@frontend/services/host.service';

@Component({
  selector: 'app-host-performance-overview',
  templateUrl: './host-performance-overview.component.html',
  styleUrls: ['./host-performance-overview.component.scss']
})
export class HostPerformanceOverviewComponent implements OnInit {

  host: IHost;
  performance: ICacheable<DtoPerformance>;
  numberOfHostEvents: number;

  // TODO: revisit these types 
  eventURL: string;
  scheduledStart: string;
  scheduledEnd: string;
  dateFormat = "dd MMM yyyy";

  constructor(@Inject(LOCALE_ID) public locale: string, private appService: AppService, private hostService: HostService) {}

  async ngOnInit() {

    const envelope = await this.hostService.readHostPerformances(this.host._id, null);
    this.numberOfHostEvents = envelope.data.length;
    this.eventURL = `${this.appService.environment.frontend_url}/events/show/${this.performance.data.data._id}`

    // Format date "dd mm yyyy"
    of(formatDate((this.performance.data.data.publicity_period.start * 1000), this.dateFormat, this.locale)).subscribe(v => {
      this.scheduledStart = v;
    });

    of(formatDate((this.performance.data.data.publicity_period.end * 1000), this.dateFormat, this.locale)).subscribe(v => {
      this.scheduledEnd = v;
    });
  }

  get isPendingSchedule(): boolean {
    return this.performance.data.data.status == PerformanceStatus.PendingSchedule;
  }
}