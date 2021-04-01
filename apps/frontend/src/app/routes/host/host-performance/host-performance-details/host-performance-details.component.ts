import { Clipboard } from '@angular/cdk/clipboard';
import { Component, OnInit } from '@angular/core';
import {
  DtoAccessToken,
  IEnvelopedData,
  IHost,
  IPerformance,
  IPerformanceHostInfo,
  Visibility
} from '@core/interfaces';
import { cachize, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { PerformanceService } from 'apps/frontend/src/app/services/performance.service';
import { IUiFieldSelectOptions } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';
import { IGraphNode } from 'apps/frontend/src/app/ui-lib/input/input.component';

@Component({
  selector: 'app-host-performance-details',
  templateUrl: './host-performance-details.component.html',
  styleUrls: ['./host-performance-details.component.scss']
})
export class HostPerformanceDetailsComponent implements OnInit {
  // Injected from parent router outlet
  performanceId: string;
  performanceHostInfo: ICacheable<IPerformanceHostInfo>;
  performance: ICacheable<IEnvelopedData<IPerformance, DtoAccessToken>>;
  host: IHost;

  copyMessage: string = 'Copy';
  visibilityOptions: IUiFieldSelectOptions = {
    multi: false,
    search: false,
    values: new Map([
      [Visibility.Private, { label: 'Private' }],
      [Visibility.Public, { label: 'Public' }]
    ])
  };

  get performanceData() {
    return this.performance.data?.data;
  }
  get phiData() {
    return this.performanceHostInfo.data;
  }

  constructor(private performanceService: PerformanceService, private clipboard: Clipboard) {}

  ngOnInit(): void {}

  updateVisibility(value:Visibility) {
    cachize(
      this.performanceService.updateVisibility(this.performanceId, value),
      this.performance,
      d => {
        // updateVisibility only returns an IPerformance but we want to keep having an IE<IPerformance, IPerformanceHostInfo>
        return {
          data: d,
          __client_data: this.performance.data.__client_data
        };
      },
      false
    );
  }

  readStreamingKey() {
    return cachize(this.performanceService.readPerformanceHostInfo(this.performanceId), this.performanceHostInfo);
  }

  copyStreamKeyToClipboard() {
    this.clipboard.copy(this.performanceHostInfo.data.stream_key);
    this.copyMessage = 'Copied!';
    setTimeout(() => {
      this.copyMessage = 'Copy';
    }, 2000);
  }
}
