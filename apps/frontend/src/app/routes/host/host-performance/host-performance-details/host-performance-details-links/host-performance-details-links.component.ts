import { SocialSharingComponent } from '@frontend/components/social-sharing/social-sharing.component';
import { Component, Inject, Input, LOCALE_ID, OnInit } from '@angular/core';
import { DtoPerformance } from '@core/interfaces';
import { ICacheable } from '@frontend/app.interfaces';
import { AppService } from '@frontend/services/app.service';

@Component({
  selector: 'app-host-performance-details-links',
  templateUrl: './host-performance-details-links.component.html',
  styleUrls: ['./host-performance-details-links.component.scss']
})
export class HostPerformanceDetailsLinksComponent implements OnInit {
  @Input() cacheable: ICacheable<DtoPerformance>;
  performanceSharingUrl: SocialSharingComponent['url'];

  get performance() {
    return this.cacheable.data.data;
  }

  constructor(private appService: AppService, @Inject(LOCALE_ID) public locale: string) {}

  ngOnInit(): void {
    const loc = this.locale ? `/${this.locale}` : '';

    this.performanceSharingUrl = `${this.appService.environment.frontend_url}${loc}/performances/show/${this.performance._id}`;
  }
}
