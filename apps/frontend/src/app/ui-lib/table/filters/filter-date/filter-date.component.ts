import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DateFilterOperator, EnumFilter, DateFilter, FilterCode, FilterQuery, Primitive } from '@core/interfaces';
import { FormComponent } from '../../../form/form.component';
import { createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { IUiDialogOptions, ThemeKind } from '../../../ui-lib.interfaces';
import { IUiFieldSelectOptions, IUiForm } from '../../../form/form.interfaces';
import { timestamp } from '@core/shared/helpers';
@Component({
  selector: 'ui-filter-date',
  templateUrl: './filter-date.component.html',
  styleUrls: ['./filter-date.component.scss']
})
export class FilterDateComponent implements OnInit {
  @ViewChild('ref') formRef: FormComponent;
  @Output() onChange: EventEmitter<FilterQuery> = new EventEmitter();
  @Input() active: string;

  cacheable: ICacheable<void> = createICacheable();
  form: IUiForm<EnumFilter>;

  buttons: IUiDialogOptions['buttons'] = [
    {
      text: 'Set Filter',
      kind: ThemeKind.Primary,
      disabled: true,
      callback: () => this.onChange.emit(this.formRef.getValue())
    }
  ];

  constructor() {}

  ngOnInit(): void {
		this.form = {
			fields: {
				operator: {
					type: 'select',
					label: 'Choose One',
					validators: [{ type: 'required' }],
					options: <IUiFieldSelectOptions>{
						values: new Map([
							[DateFilterOperator.Equals, { label: 'Equals' }],
							[DateFilterOperator.After, { label: 'After' }],
							[DateFilterOperator.Before, { label: 'Before' }],
							[DateFilterOperator.Between, { label: 'Between' }],
						])
					}
				},
				date_single: {
					type: "date",
					label: "Select Date",
					hide: fg => fg.controls["operator"].value == DateFilterOperator.Between,
				},
				date_range: {
					type: "date",
					label: "Start Date Range",
					hide: fg => fg.controls["operator"].value != DateFilterOperator.Between,
					options: {
						is_date_range: true
					}
				},
			},
			submit: {
				is_hidden: true,
				text: 'Add Filter',
				variant: 'primary',
				handler: async v => v,
				transformer: (v):DateFilter => {
					const f = [FilterCode.Date, v.operator]
					if(v.operator == DateFilterOperator.Between) {
						f.push(timestamp(v.date_range.start))
						f.push(timestamp(v.date_range.end))
					} else {
						f.push(timestamp(v.date_start))
					}

					return f as DateFilter;
				}
			}
		};
	}

  ngOnChanges(changes) {
    if (changes.active?.currentValue && this.buttons.length == 1) {
      this.buttons.push({
        text: 'Remove',
        kind: ThemeKind.Secondary,
        callback: () => {
          this.onChange.emit(null);
          this.formRef.formGroup.reset();
          this.formRef.formGroup.markAsPristine(); // remove required errors
          this.buttons.pop();
        }
      });
    }
  }
}
