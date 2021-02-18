import { Component, Input } from '@angular/core';
import { IPerformance } from '@core/interfaces';
import { createICacheable, ICacheable } from '../../../../../app/app.interfaces';
import { PerformanceService } from '../../../../services/performance.service';
import { IUiForm } from '../../../../ui-lib/form/form.interfaces';
import { BaseAppService, RouteParam } from '../../../../services/app.service';

@Component({
  selector: 'app-update-performance',
  templateUrl: './app-update-performance.component.html',
  styleUrls: ['./app-update-performance.component.scss'],
})
export class UpdatePerformanceComponent {
performanceId: string;
performance: IPerformance;
performanceCacheable: ICacheable<IPerformance> = createICacheable();
performanceDetailsForm: IUiForm<IPerformance> = {
    
    fields: {
      name: { label: 'Name', type: 'text' },
      description: { label: 'Description', type: 'textarea', validators: [{ type: 'maxlength', value: 100 }]},      
    },

    submit: {
      text: 'Update Details',
      variant: 'primary',
      handler: data => this.performanceService.updatePerformance(this.performanceId, data)
    }
  };

  constructor(      
      private performanceService: PerformanceService,
      private baseAppService: BaseAppService      
      ) {}

  ngOnInit(): void {
    this.performanceId = this.baseAppService.getParam(RouteParam.PerformanceId);
    }
  
  handleSuccessfulUpdate(event:IPerformance) {    
  }
}
