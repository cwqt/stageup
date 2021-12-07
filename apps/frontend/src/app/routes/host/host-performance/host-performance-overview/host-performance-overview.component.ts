import { Component, LOCALE_ID, OnInit, Inject } from '@angular/core';
import { DtoPerformance, IHost, PerformanceStatus } from '@core/interfaces';
import { cachize, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { of } from 'rxjs';
import { formatDate } from "@angular/common";
import { AppService } from '@frontend/services/app.service';
import { HostService } from '@frontend/services/host.service';
import { PerformanceService } from '@frontend/services/performance.service';
import { PerformanceStatusPipe } from '@frontend/_pipes/performance-status.pipe';
@Component({
  selector: 'app-host-performance-overview',
  templateUrl: './host-performance-overview.component.html',
  styleUrls: ['./host-performance-overview.component.scss']
})
export class HostPerformanceOverviewComponent implements OnInit {

  constructor(@Inject(LOCALE_ID) public locale: string, private appService: AppService, private hostService: HostService, private performanceService: PerformanceService) {}

  host: IHost;
  performance: ICacheable<DtoPerformance>;
  numberOfHostEvents: number;

  // TODO: revisit these types 
  eventURL: string;
  scheduledStart: string;
  scheduledEnd: string;
  dateFormat = "dd MMM yyyy";
  eventStatus: PerformanceStatus;

  get isPendingSchedule(): boolean {
    return this.performance.data.data.status == PerformanceStatus.PendingSchedule;
  }

  get performanceData() {
    return this.performance.data?.data;
  }

  get timezone() {
    return new Date(this.performance.data.data.publicity_period.start).toLocaleTimeString('en-us', { timeZoneName: 'short' }).split(' ')[2]
  }

  get performanceStatus() {
    const statusPipe = new PerformanceStatusPipe();
    return statusPipe.transform(this.performanceData.status)
  }

  async ngOnInit() {
    await cachize(this.performanceService.readPerformance(this.performance.data.data._id), this.performance);
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

  navigateToSetSchedule() {
    this.appService.navigateTo('/dashboard/events/' + this.performance.data.data._id)
  }

}
