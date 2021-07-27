import { Component, EventEmitter, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ISelectReasonData } from '@core/interfaces';
import { UiDialogButton } from '@frontend/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { UiField, UiForm } from '@frontend/ui-lib/form/form.interfaces';
import { IUiDialogOptions, ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';

@Component({
  selector: 'frontend-select-reason-dialog',
  templateUrl: './select-reason-dialog.component.html',
  styleUrls: ['./select-reason-dialog.component.css']
})
export class SelectReasonDialogComponent implements OnInit, IUiDialogOptions {
  public selectReasonForm: UiForm;
  public buttons: IUiDialogOptions['buttons'];

  submit: EventEmitter<string> = new EventEmitter();
  cancel: EventEmitter<string> = new EventEmitter();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ISelectReasonData,
    public ref: MatDialogRef<SelectReasonDialogComponent>
  ) {}

  ngOnInit(): void {
    this.buttons = [
      new UiDialogButton({ kind: ThemeKind.Secondary, label: $localize`Cancel`, callback: () => this.cancel.emit() }),
      new UiDialogButton({
        kind: ThemeKind.Primary,
        label: $localize`${this.data.confirm_button_label}`,
        callback: async () => {
          const res = await this.selectReasonForm.submit();
        }
      })
    ];

    this.selectReasonForm = new UiForm({
      fields: {
        select_reason: UiField.Select({
          values: null,
          validators: [{ type: 'required' }]
        })
      },
      resolvers: null,
      handlers: null
    });
  }
}
