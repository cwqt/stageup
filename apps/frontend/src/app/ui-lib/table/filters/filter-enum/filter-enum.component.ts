import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { IUITableFilter } from '../filter.interface';
import { EnumFilter, EnumFilterOperator, FilterCode, FilterQuery, Primitive } from '@core/interfaces';
import { IUiTableColumnFilter } from '../../table.interfaces';
import { FormComponent } from '../../../form/form.component';
import { createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { IUiDialogOptions, ThemeKind } from '../../../ui-lib.interfaces';
import { IUiForm, UiField, UiForm } from '../../../form/form.interfaces';
import { UiDialogButton } from '../../../dialog/dialog-buttons/dialog-buttons.component';
import { SimpleConsoleLogger } from 'typeorm';

@Component({
  selector: 'ui-filter-enum',
  templateUrl: './filter-enum.component.html',
  styleUrls: ['./filter-enum.component.scss']
})
export class FilterEnumComponent implements OnInit, IUITableFilter {
  @Input() enum: IUiTableColumnFilter['enum'];
  @Output() onChange: EventEmitter<FilterQuery> = new EventEmitter();
  @Input() active: string;

  form: UiForm<EnumFilter>;
  buttons: IUiDialogOptions['buttons'];

  constructor() {}

  ngOnInit(): void {
    this.form = new UiForm({
      fields: [...this.enum.entries()].reduce((acc, [k, v]) => {
        acc[`enum_${k}`] = UiField.Checkbox({
          label: v.label
        });
        return acc;
      }, {}),
      resolvers: {
        output: async v => [
          FilterCode.Enum,
          EnumFilterOperator.Contains,
          ...(Object.values(v)
            .map((v, idx) => v && [...this.enum.keys()][idx])
            .filter(v => v !== false && v !== '' && v !== null) as Primitive[])
        ]
      },
      handlers: {
        success: async v => {
          const enums: EnumFilter = v;
          if (enums.length > 2) {
            this.onChange.emit(enums);
          } else {
            // clear the filter if none provided
            this.onChange.emit(null);
          }
        }
      }
    });

    this.buttons = [
      new UiDialogButton({
        label: $localize`Set Filter`,
        kind: ThemeKind.Primary,
        disabled: true,
        callback: () => this.form.submit()
      }).attach(this.form)
    ];
  }

  ngOnChanges(changes) {
    if (changes.active?.currentValue && this.buttons.length == 1) {
      this.buttons.push(
        new UiDialogButton({
          label: $localize`Remove`,
          kind: ThemeKind.Secondary,
          callback: () => {
            this.onChange.emit(null);
            this.form.group.reset();
            this.form.group.markAsPristine(); // remove required errors
            this.buttons.pop();
          }
        })
      );
    }
  }
}
