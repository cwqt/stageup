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
          label: $localize`Choose One`,
          validators: [{ type: 'required' }],
          // prettier-ignore
          values: new Map([
            // TODO: add between
            // [NumberFilterOperator.Between, { label: 'Between' }],
            [NumberFilterOperator.DoesNotEqual,       { label: $localize`:@@number_filter_neq:Does Not Equal` }],
            [NumberFilterOperator.Equals,             { label: $localize`:@@number_filter_eq:Equals` }],
            [NumberFilterOperator.GreaterThan,        { label: $localize`:@@number_filter_gt:Greater Than` }],
            [NumberFilterOperator.GreaterThanOrEqual, { label: $localize`:@@number_filter_gte:Greater Than Or Equal` }],
            [NumberFilterOperator.LessThan,           { label: $localize`:@@number_filter_lt:Less Than` }],
            [NumberFilterOperator.LessThanOrEqual,    { label: $localize`:@@number_filter_lte:Less Than Or Equal` }]
          ])
        }),
        value: UiField.Number({
          label: $localize`Amount`,
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
