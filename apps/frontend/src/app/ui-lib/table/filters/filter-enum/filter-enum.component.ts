import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { IUITableFilter } from '../filter.interface';
import { EnumFilter, EnumFilterOperator, FilterCode, FilterQuery, Primitive } from '@core/interfaces';
import { IUiTableColumnFilter } from '../../table.interfaces';
import { FormComponent } from '../../../form/form.component';
import { createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { IUiDialogOptions, ThemeKind } from '../../../ui-lib.interfaces';
import { IUiForm } from '../../../form/form.interfaces';

@Component({
  selector: 'ui-filter-enum',
  templateUrl: './filter-enum.component.html',
  styleUrls: ['./filter-enum.component.scss']
})
export class FilterEnumComponent implements OnInit, IUITableFilter {
  @Input() enum: IUiTableColumnFilter['enum'];
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
      callback: () => {
        const enums: EnumFilter = this.formRef.getValue();
        if (enums.length > 2) {
          this.onChange.emit(enums);
        } else {
          // clear the filter if none provided
          this.onChange.emit(null);
        }
      }
    }
  ];

  constructor() {}

  ngOnInit(): void {
    this.form = {
      fields: [...this.enum.entries()].reduce((acc, [k, v]) => {
        acc[`enum_${k}`] = {
          type: 'checkbox',
          label: v.label
        };
        return acc;
      }, {}),
      submit: {
        is_hidden: true,
        text: 'Add Filter',
        variant: 'primary',
        handler: async v => v,
        transformer: (v): EnumFilter => [
          FilterCode.Enum,
          EnumFilterOperator.Contains,
          ...((Object.values(v)
            .map((v, idx) => v && [...this.enum.keys()][idx])
            .filter(v => v !== false && v !== '' && v !== null) as Primitive[]))
        ]
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
