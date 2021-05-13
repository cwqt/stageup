import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DateFilter, DateFilterOperator, FilterCode, FilterQuery } from '@core/interfaces';
import { timestamp } from '@core/helpers';
import { UiDialogButton } from '../../../dialog/dialog-buttons/dialog-buttons.component';
import { UiField, UiForm } from '../../../form/form.interfaces';
import { IUiDialogOptions, ThemeKind } from '../../../ui-lib.interfaces';
@Component({
  selector: 'ui-filter-date',
  templateUrl: './filter-date.component.html',
  styleUrls: ['./filter-date.component.scss']
})
export class FilterDateComponent implements OnInit {
  @Output() onChange: EventEmitter<FilterQuery> = new EventEmitter();
  @Input() active: string;

  form: UiForm<DateFilter>;
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
            [DateFilterOperator.Equals,   { label: $localize`:@@filter_date_eq:Equals` }],
            [DateFilterOperator.After,    { label: $localize`:@@filter_date_gt:After` }],
            [DateFilterOperator.Before,   { label: $localize`:@@filter_date_lt:Before` }],
            [DateFilterOperator.Between,  { label: $localize`:@@filter_date_btw:Between` }]
          ])
        }),
        date_single: UiField.Date({
          label: $localize`Select Date`,
          hide: fg => fg.controls['operator'].value == DateFilterOperator.Between
        }),
        date_range: UiField.Date({
          label: $localize`Start Date Range`,
          hide: fg => fg.controls['operator'].value != DateFilterOperator.Between,
          is_date_range: true
        })
      },
      resolvers: {
        output: async v => {
          const f = [FilterCode.Date, v.operator];
          if (v.operator == DateFilterOperator.Between) {
            f.push(timestamp(v.date_range.start));
            f.push(timestamp(v.date_range.end));
          } else {
            f.push(timestamp(v.date_single));
          }

          return f as DateFilter;
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
