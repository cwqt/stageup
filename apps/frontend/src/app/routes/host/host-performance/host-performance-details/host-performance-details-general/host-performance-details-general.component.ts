import { Component, Input, OnInit } from '@angular/core';
import { DtoPerformance, GenreMap, IPerformance } from '@core/interfaces';
import { createICacheable, ICacheable } from '@frontend/app.interfaces';
import { PerformanceService } from '@frontend/services/performance.service';
import { UiField, UiForm } from '@frontend/ui-lib/form/form.interfaces';

@Component({
  selector: 'app-host-performance-details-general',
  templateUrl: './host-performance-details-general.component.html',
  styleUrls: ['./host-performance-details-general.component.scss']
})
export class HostPerformanceDetailsGeneralComponent implements OnInit {
  @Input() cacheable: ICacheable<DtoPerformance>;
  performanceDetailsForm: UiForm<IPerformance>;
  performanceUpdateCacheable: ICacheable<IPerformance>;

  get performance() {
    return this.cacheable.data.data;
  }

  constructor(private performanceService: PerformanceService) {}

  ngOnInit(): void {
    this.performanceUpdateCacheable = createICacheable(this.performance);
    this.performanceDetailsForm = new UiForm({
      fields: {
        name: UiField.Text({
          label: $localize`Event Title`,
          initial: this.performance.name,
          validators: [{ type: 'required' }, { type: 'maxlength', value: 80 }]
        }),
        shortDescription: UiField.Richtext({
          label: $localize`Short Description`,
          initial: this.performance.description,
          validators: [{ type: 'maxlength', value: 160 }]
        }),
        longDescription: UiField.Richtext({
          label: $localize`Long Description`,
          initial: this.performance.description,
          validators: [{ type: 'maxlength', value: 1000 }]
        }),
        genre: UiField.Select({
          label: $localize`Genre`,
          values: new Map(
            // TODO: Localize genres
            Object.entries(GenreMap).map(([key, value]) => {
              return [key, { label: value as string }];
            })
          )
        })
      },
      resolvers: {
        output: async v => this.performanceService.updatePerformance(this.performance._id, v)
      },
      handlers: {
        success: async (v, f) => {
          this.cacheable.data.data = { ...this.performance, name: f.value.name, description: f.value.description };
        }
      }
    });
  }
}
