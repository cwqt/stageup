import { Component, EventEmitter, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ISelectReasonData } from '@core/interfaces';
import { ToastService } from '@frontend/services/toast.service';
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
    private toastService: ToastService,
    public ref: MatDialogRef<SelectReasonDialogComponent>
  ) {}

  ngOnInit(): void {
    this.buttons = [
      new UiDialogButton({ kind: ThemeKind.Secondary, label: $localize`Cancel`, callback: () => this.cancel.emit() }),
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
          values: this.data.reasons.reduce((acc, curr) => {
            acc.set(curr, { label: curr });
            return acc;
          }, new Map()),
          validators: [{ type: 'required' }]
        }),
        further_info: UiField.Textarea({
          placeholder: 'Another reason?',
          hide: this.data.hide_further_info
        })
      },
      resolvers: {
        output: async () => {}
      },
      handlers: {
        success: async () => {
          this.submit.emit();
          this.toastService.emit($localize`Performance Deleted!`);
          this.ref.close();
        },
        failure: async err => {
          this.toastService.emit(err.message, ThemeKind.Danger);
          this.ref.close(null);
        }
      }
    });
  }
}
