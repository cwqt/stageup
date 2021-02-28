import { Component, Input } from '@angular/core';
import { IEnvelopedData, IPerformance, IPerformanceUserInfo } from '@core/interfaces';
import { createICacheable, ICacheable } from '../../../../../app/app.interfaces';
import { PerformanceService } from '../../../../services/performance.service';
import { IUiForm } from '../../../../ui-lib/form/form.interfaces';
import { BaseAppService, RouteParam } from '../../../../services/app.service';

@Component({
  selector: 'app-update-performance',
  templateUrl: './app-update-performance.component.html',
  styleUrls: ['./app-update-performance.component.scss']
})
export class UpdatePerformanceComponent {
  @Input() cacheable: ICacheable<IEnvelopedData<IPerformance, IPerformanceUserInfo>>;
  performanceDetailsForm: IUiForm<IPerformance>;
  performanceUpdateCacheable: ICacheable<IPerformance>;

  constructor(private performanceService: PerformanceService) {}

  get performance() {
    return this.cacheable.data.data;
  }

  ngOnInit(): void {
    this.performanceUpdateCacheable = createICacheable(this.performance);

    this.performanceDetailsForm = {
      fields: {
        name: { label: 'Name', type: 'text', initial: this.performance.name, validators: [{ type: 'required' }] },
        description: {
          label: 'Description',
          type: 'textarea',
          initial: this.performance.description,
          validators: [{ type: 'maxlength', value: 100 }]
        }
      },

      submit: {
        text: 'Update Details',
        variant: 'primary',
        handler: data => this.performanceService.updatePerformance(this.performance._id, data)
      }
    };
  }

  handleSuccessfulUpdate(event: IPerformance) {
    // Propagate the change into the parent class to update top-level performance name
    this.cacheable.data.data = event;
  }
}
