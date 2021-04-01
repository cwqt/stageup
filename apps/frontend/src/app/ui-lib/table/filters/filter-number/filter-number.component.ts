import { Component, Input, OnInit, Output, EventEmitter, ViewChild, OnChanges } from '@angular/core';
import {
  FilterCode,
  FilterQuery,
  NumberFilter,
  NumberFilterOperator,
  StringFilter,
  StringFilterOperator
} from '@core/interfaces';
import { to } from '@core/shared/helpers';
import { createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { FormComponent } from '../../../form/form.component';
import { IUiFieldSelectOptions, IUiForm } from '../../../form/form.interfaces';
import { IUiDialogOptions, ThemeKind } from '../../../ui-lib.interfaces';
import { IUITableFilter } from '../filter.interface';

@Component({
  selector: 'ui-filter-number',
  templateUrl: './filter-number.component.html',
  styleUrls: ['./filter-number.component.scss']
})
export class FilterNumberComponent implements OnInit {
  @ViewChild('ref') formRef: FormComponent;
  @Output() onChange: EventEmitter<FilterQuery> = new EventEmitter();
  @Input() active: string;

  cacheable: ICacheable<void> = createICacheable();
  form: IUiForm<StringFilter> = {
    fields: {
      operator: {
        type: 'select',
        label: 'Choose One',
        validators: [{ type: 'required' }],
        options: to<IUiFieldSelectOptions>({
          values: new Map([
            // TODO: add between
            // [NumberFilterOperator.Between, { label: 'Between' }],
            [NumberFilterOperator.DoesNotEqual, { label: 'Does Not Equal' }],
            [NumberFilterOperator.Equals, { label: 'Equals' }],
            [NumberFilterOperator.GreaterThan, { label: 'Greater Than' }],
            [NumberFilterOperator.GreaterThanOrEqual, { label: 'Greater Than Or Equal' }],
            [NumberFilterOperator.LessThan, { label: 'Less Than' }],
            [NumberFilterOperator.LessThanOrEqual, { label: 'Less Than Or Equal' }]
          ])
        })
      },
      value: {
        type: 'number',
        label: 'Amount',
        validators: [{ type: 'required' }]
      }
    },
    submit: {
      is_hidden: true,
      text: 'Add Filter',
      variant: 'primary',
      handler: async v => v,
      transformer: (v): NumberFilter => [FilterCode.Number, v.operator, v.value]
    }
  };

  buttons: IUiDialogOptions['buttons'] = [
    {
      text: 'Set Filter',
      kind: ThemeKind.Primary,
      disabled: true,
      callback: () => this.onChange.emit(this.formRef.getValue())
    }
  ];

  constructor() {}

  ngOnInit(): void {}

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
