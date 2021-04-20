import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { FilterCode, FilterQuery, StringFilter, StringFilterOperator } from '@core/interfaces';
import { UiDialogButton } from '../../../dialog/dialog-buttons/dialog-buttons.component';
import { UiField, UiForm } from '../../../form/form.interfaces';
import { IUiDialogOptions, ThemeKind } from '../../../ui-lib.interfaces';
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
          label: 'Choose One',
          validators: [{ type: 'required' }],
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
        }),
        value: UiField.Text({
          label: 'Value',
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
        label: 'Set Filter',
        kind: ThemeKind.Primary,
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
