import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DtoPerformance, Genre, GenreMap } from '@core/interfaces';
import { ICacheable } from '@frontend/app.interfaces';
import { UiField, UiForm } from '@frontend/ui-lib/form/form.interfaces';
import { GenrePipe } from '@frontend/_pipes/genre.pipe';

@Component({
  selector: 'app-host-performance-details-general',
  templateUrl: './host-performance-details-general.component.html',
  styleUrls: ['./host-performance-details-general.component.scss']
})
export class HostPerformanceDetailsGeneralComponent implements OnInit {
  @Input() cacheable: ICacheable<DtoPerformance>;
  @Output() onFormDataChange = new EventEmitter();
  performanceDetailsForm: UiForm<void>; // This form does not handle submit but instead passes data to parent component

  get performance() {
    return this.cacheable.data.data;
  }

  constructor() {}

  ngOnInit(): void {
    const genrePipe = new GenrePipe();

    this.performanceDetailsForm = new UiForm({
      fields: {
        name: UiField.Text({
          label: $localize`Event Title`,
          initial: this.performance.name,
          validators: [{ type: 'required' }, { type: 'maxlength', value: 100 }],
          appearance: 'outline'
        }),
        short_description: UiField.Richtext({
          label: $localize`Short Description`,
          initial: this.performance.short_description,
          validators: [{ type: 'maxlength', value: 260 }]
        }),
        long_description: UiField.Richtext({
          label: $localize`Long Description`,
          initial: this.performance.long_description,
          validators: [{ type: 'maxlength', value: 1000 }]
        }),
        genre: UiField.Select({
          label: $localize`Genre`,
          values: new Map(
            Object.entries(GenreMap).map(([key]) => {
              return [key, { label: genrePipe.transform(key as Genre) }];
            })
          )
        }),
        terms: UiField.Checkbox({
          label: $localize`I'm in compliance with the licenses required to stream this production. I have read the uploaders terms and conditions to stream a production legally`,
          validators: [{ type: 'required' }]
        })
      },
      resolvers: {
        output: async () => {}
      },
      handlers: {
        changes: async formData => {
          this.onFormDataChange.emit(formData);
        }
      }
    });
    console.log('lol', this.performanceDetailsForm.group);
  }
}
