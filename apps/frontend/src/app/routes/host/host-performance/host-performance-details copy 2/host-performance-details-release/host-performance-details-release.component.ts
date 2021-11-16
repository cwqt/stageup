import { unix } from '@core/helpers';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DtoPerformance } from '@core/interfaces';
import { ICacheable } from '@frontend/app.interfaces';
import { UiField, UiForm } from '@frontend/ui-lib/form/form.interfaces';

@Component({
  selector: 'app-host-performance-details-release',
  templateUrl: './host-performance-details-release.component.html',
  styleUrls: ['./host-performance-details-release.component.scss']
})
export class HostPerformanceDetailsReleaseComponent implements OnInit {
  @Input() cacheable: ICacheable<DtoPerformance>;
  @Output() onFormDataChange = new EventEmitter();
  performanceDetailsForm: UiForm<void>; // This form does not handle submit but instead passes data to parent component
  // performanceUpdateCacheable: ICacheable<IPerformance>;

  get performance() {
    return this.cacheable.data.data;
  }

  constructor() {}

  ngOnInit(): void {
    // this.performanceUpdateCacheable = createICacheable(this.performance);

    this.performanceDetailsForm = new UiForm({
      fields: {
        publicity_period: UiField.Date({
          initial: {
            start: this.performance.publicity_period.start ? unix(this.performance.publicity_period.start) : undefined,
            end: this.performance.publicity_period.end ? unix(this.performance.publicity_period.end) : undefined
          },
          is_date_range: true,
          actions: true,
          min_date: new Date(),
          label: $localize`Event Visibility Schedule`
        })
      },
      resolvers: {
        output: async () => {}
      },
      handlers: {
        changes: async formData => this.onFormDataChange.emit(formData)
      }
    });
  }
}
