import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { FilterCode, FilterQuery, StringFilter, StringFilterOperator } from '@core/interfaces';
import { UiDialogButton } from '../../../dialog/dialog-buttons/dialog-buttons.component';
import { UiField, UiForm } from '../../../form/form.interfaces';
import { IUiDialogOptions, SecondaryButton, ThemeKind } from '../../../ui-lib.interfaces';
import { IUITableFilter } from '../filter.interface';

@Component({
  selector: 'ui-filter-string',
  templateUrl: './filter-string.component.html',
  styleUrls: ['./filter-string.component.scss']
})
export class FilterStringComponent implements OnInit, IUITableFilter, OnChanges {
  @Output() onChange: EventEmitter<FilterQuery> = new EventEmitter();
  @Input() active: string;

  form: UiForm<StringFilter>;
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
            [StringFilterOperator.Equals,           { label: $localize`:@@filter_string_label_eq:Equals` }],
            [StringFilterOperator.DoesNotEqual,     { label: $localize`:@@filter_string_label_neq:Does Not Equal` }],
            [StringFilterOperator.BeginsWith,       { label: $localize`:@@filter_string_label_bw:Begins With` }],
            [StringFilterOperator.DoesNotBeginWith, { label: $localize`:@@filter_string_label_nbw:Does Not Begin With` }],
            [StringFilterOperator.EndsWith,         { label: $localize`:@@filter_string_label_ew:Ends With` }],
            [StringFilterOperator.DoesNotEndWith,   { label: $localize`:@@filter_string_label_new:Does Not End With` }],
            [StringFilterOperator.Contains,         { label: $localize`:@@filter_string_label_inc:Contains` }],
            [StringFilterOperator.DoesNotContain,   { label: $localize`:@@filter_string_label_ninc:Does Not Contain` }]
          ])
        }),
        value: UiField.Text({
          label: $localize`Value`,
          validators: [{ type: 'required' }]
        })
      },
      resolvers: {
        output: async v => [FilterCode.String, v.operator, v.value]
      },
      handlers: {
        success: async v => this.onChange.emit(v)
      }
    });

    this.buttons = [
      new UiDialogButton({
        label: $localize`Set Filter`,
        kind: ThemeKind.Primary,
        callback: () => this.form.submit()
      }).attach(this.form)
    ];
  }

  ngOnChanges(changes) {
    if (changes.active?.currentValue && this.buttons.length == 1) {
      this.buttons.push(
        new UiDialogButton({
          label: $localize`Remove`,
          kind: SecondaryButton,
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
