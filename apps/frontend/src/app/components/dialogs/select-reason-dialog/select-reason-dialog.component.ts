import { Component, EventEmitter, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IRemovalReason, ISelectReasonData, Primitive } from '@core/interfaces';
import { UiDialogButton } from '@frontend/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { UiField, UiForm } from '@frontend/ui-lib/form/form.interfaces';
import {
  IUiDialogOptions,
  ThemeKind,
  ThemeAppearance,
  ThemeStyle,
  SecondaryButton
} from '@frontend/ui-lib/ui-lib.interfaces';

@Component({
  selector: 'frontend-select-reason-dialog',
  templateUrl: './select-reason-dialog.component.html',
  styleUrls: ['./select-reason-dialog.component.css']
})
export class SelectReasonDialogComponent implements OnInit, IUiDialogOptions {
  public selectReasonForm: UiForm;
  public buttons: IUiDialogOptions['buttons'];

  submit: EventEmitter<IRemovalReason> = new EventEmitter();
  cancel: EventEmitter<string> = new EventEmitter();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ISelectReasonData<Primitive>,
    public ref: MatDialogRef<SelectReasonDialogComponent>
  ) {}

  ngOnInit(): void {
    this.buttons = [
      new UiDialogButton({
        kind: SecondaryButton,
        label: $localize`Cancel`,
        callback: () => this.cancel.emit()
      }),
      new UiDialogButton({
        kind: ThemeKind.Primary,
        label: $localize`Confirm`,
        callback: async () => {
          const res = await this.selectReasonForm.submit();
        }
      })
    ];

    this.selectReasonForm = new UiForm({
      fields: {
        select_reason: UiField.Select({
          values: this.data.reasons,
          placeholder: $localize`Select an option`,
          validators: [{ type: 'required' }]
        }),
        further_info: UiField.Textarea({
          placeholder: 'Another reason?',
          hide: fg => this.data.hide_further_info(fg.value.select_reason)
        })
      },
      resolvers: {
        output: async () => {}
      },
      handlers: {
        success: async (v, fg) => {
          this.submit.emit({
            removal_reason: fg.value.select_reason,
            further_info: fg.value.further_info
          });
          this.ref.close();
        },

        failure: async err => {
          this.ref.close(null);
        }
      }
    });
  }
}
