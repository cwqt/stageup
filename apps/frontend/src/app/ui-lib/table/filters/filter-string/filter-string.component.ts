import { Component, Input, OnInit, Output, EventEmitter, ViewChild, OnChanges } from '@angular/core';
import { FilterCode, FilterQuery, StringFilter, StringFilterOperator } from '@core/interfaces';
import { createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { FormComponent } from '../../../form/form.component';
import { IUiFieldSelectOptions, IUiForm } from '../../../form/form.interfaces';
import { IUiDialogOptions, ThemeKind } from '../../../ui-lib.interfaces';
import { IUITableFilter } from '../filter.interface';

@Component({
  selector: 'ui-filter-string',
  templateUrl: './filter-string.component.html',
  styleUrls: ['./filter-string.component.scss']
})
export class FilterStringComponent implements OnInit, IUITableFilter, OnChanges {
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
        options: <IUiFieldSelectOptions>{
          values: new Map([
            [StringFilterOperator.Equals, { label: 'Equals' }],
            [StringFilterOperator.DoesNotEqual, { label: 'Does Not Equal' }],
            [StringFilterOperator.BeginsWith, { label: 'Begins With' }],
            [StringFilterOperator.DoesNotBeginWith, { label: 'Does Not Begin With' }],
            [StringFilterOperator.EndsWith, { label: 'Ends With' }],
            [StringFilterOperator.DoesNotEndWith, { label: 'Does Not End With' }],
            [StringFilterOperator.Contains, { label: 'Contains' }],
            [StringFilterOperator.DoesNotContain, { label: 'Does Not Contain' }]
          ])
        }
      },
      value: {
        type: 'text',
        label: 'Value',
        validators: [{ type: 'required' }]
      }
    },
    submit: {
      is_hidden: true,
      text: 'Add Filter',
      variant: 'primary',
      handler: async v => v,
      transformer: (v): StringFilter => [FilterCode.String, v.operator, v.value]
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
