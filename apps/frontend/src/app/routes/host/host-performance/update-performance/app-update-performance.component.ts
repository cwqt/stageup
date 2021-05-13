import { Component, Input } from '@angular/core';
import { DtoPerformance, IPerformance } from '@core/interfaces';
import { createICacheable, ICacheable } from '../../../../../app/app.interfaces';
import { PerformanceService } from '../../../../services/performance.service';
import { UiField, UiForm } from '../../../../ui-lib/form/form.interfaces';

@Component({
  selector: 'app-update-performance',
  templateUrl: './app-update-performance.component.html',
  styleUrls: ['./app-update-performance.component.scss']
})
export class UpdatePerformanceComponent {
  @Input() cacheable: ICacheable<DtoPerformance>;
  performanceDetailsForm: UiForm<IPerformance>;
  performanceUpdateCacheable: ICacheable<IPerformance>;

  constructor(private performanceService: PerformanceService) {}

  get performance() {
    return this.cacheable.data.data;
  }

  ngOnInit(): void {
    this.performanceUpdateCacheable = createICacheable(this.performance);

    this.performanceDetailsForm = new UiForm({
      fields: {
        name: UiField.Text({
          label: 'Title',
          initial: this.performance.name,
          validators: [{ type: 'required' }, { type: 'maxlength', value: 64 }]
        }),
        description: UiField.Richtext({
          label: 'Description',
          // initial: this.performance.description,
          validators: [{ type: 'maxlength', value: 512 }]
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

  handleSuccessfulUpdate(event: IPerformance) {
    // Propagate the change into the parent class to update top-level performance name
    this.cacheable.data.data = event;
  }
}
