import { Clipboard } from '@angular/cdk/clipboard';
import { Component, OnInit } from '@angular/core';
import { DtoPerformance, IHost, IPerformanceHostInfo, Visibility } from '@core/interfaces';
import { cachize, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { PerformanceService } from 'apps/frontend/src/app/services/performance.service';
import { IUiFormField, UiField, UiForm } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';
import { PerformanceWatchComponent } from '../../../performance-watch/performance-watch.component';

@Component({
  selector: 'app-host-performance-details',
  templateUrl: './host-performance-details.component.html',
  styleUrls: ['./host-performance-details.component.scss']
})
export class HostPerformanceDetailsComponent implements OnInit {
  // Injected from parent router outlet
  performanceId: string;
  performanceHostInfo: ICacheable<IPerformanceHostInfo>;
  performance: ICacheable<DtoPerformance>;
  host: IHost;

  copyMessage: string = 'Copy';
  visibilityInput:IUiFormField<"select">;

  get performanceData() {
    return this.performance.data?.data;
  }
  get phiData() {
    return this.performanceHostInfo.data;
  }

  visibilityForm:UiForm;

  constructor(private performanceService: PerformanceService, private clipboard: Clipboard) {}

  ngOnInit(): void {
    this.visibilityForm = new UiForm({
      fields: {
        visibility: UiField.Select({
          label: "Performance Visibility",
          multi_select: false,
          has_search: false,
          initial: this.performanceData.visibility,
          disabled: !this.host.is_onboarded,
          values: new Map([
            [Visibility.Private, { label: 'Private' }],
            [Visibility.Public, { label: 'Public' }]
          ])
        })
      },
      resolvers: {
        output: v => this.performanceService.updateVisibility(this.performanceId, v.visibility)
      },
      handlers: {
        changes: async () => this.visibilityForm.submit()
      }
    })
  }


  // updateVisibility(value: Visibility) {
  //   cachize(
  //     this.performanceService.updateVisibility(this.performanceId, value),
  //     this.performance,
  //     d => {
  //       // updateVisibility only returns an IPerformance but we want to keep having an IE<IPerformance, IPerformanceHostInfo>
  //       return {
  //         data: d,
  //         __client_data: this.performance.data.__client_data
  //       };
  //     },
  //     false
  //   );
  // }

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
