import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FilterCode, FilterQuery, NumberFilter, NumberFilterOperator } from '@core/interfaces';
import { UiDialogButton } from '../../../dialog/dialog-buttons/dialog-buttons.component';
import { UiField, UiForm } from '../../../form/form.interfaces';
import { IUiDialogOptions, ThemeKind } from '../../../ui-lib.interfaces';

@Component({
  selector: 'ui-filter-number',
  templateUrl: './filter-number.component.html',
  styleUrls: ['./filter-number.component.scss']
})
export class FilterNumberComponent implements OnInit {
  @Output() onChange: EventEmitter<FilterQuery> = new EventEmitter();
  @Input() active: string;

  form: UiForm<NumberFilter>;
  buttons: IUiDialogOptions['buttons'];

  constructor() {}

  ngOnInit(): void {
    this.form = new UiForm({
      fields: {
        operator: UiField.Select({
          label: 'Choose One',
          validators: [{ type: 'required' }],
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
        }),
        value: UiField.Number({
          label: 'Amount',
          validators: [{ type: 'required' }]
        })
      },
      resolvers: {
        output: async v => [FilterCode.Number, v.operator, v.value]
      },
      handlers: {
        success: async v => this.onChange.emit(v)
      }
    });

    this.buttons = [
      new UiDialogButton({
        label: 'Set Filter',
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
          label: 'Remove',
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
