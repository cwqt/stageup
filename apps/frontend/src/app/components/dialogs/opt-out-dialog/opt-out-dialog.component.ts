import { OptOutOptions } from './../../../../../../../libs/interfaces/src/gdpr/consent.interface';
import { OptOutReason } from '@frontend/_pipes/opt-out-reason.pipe';
import { MyselfService } from '@frontend/services/myself.service';
import { IHostStub, IUserStub } from '@core/interfaces';
import { UiForm, UiField } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';
import { IUiDialogOptions, ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

import { Component, OnInit, EventEmitter, Output, Inject } from '@angular/core';
import { UiDialogButton } from '@frontend/ui-lib/dialog/dialog-buttons/dialog-buttons.component';

@Component({
  selector: 'frontend-opt-out-dialog',
  templateUrl: './opt-out-dialog.component.html',
  styleUrls: ['./opt-out-dialog.component.scss']
})
export class OptOutDialogComponent implements OnInit, IUiDialogOptions {
  @Output() submit: EventEmitter<string> = new EventEmitter();
  @Output() cancel: EventEmitter<string> = new EventEmitter();

  public optOutForm: UiForm;

  buttons: IUiDialogOptions['buttons'] = [
    new UiDialogButton({
      label: $localize`Cancel`,
      kind: ThemeKind.Secondary,
      callback: () => this.cancel.emit()
    }),
    new UiDialogButton({
      label: $localize`Confirm`,
      kind: ThemeKind.Primary,
      loading: false,
      callback: data => this.optOutForm.submit()
    })
  ];

  get submitButton() {
    return this.buttons[1];
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { host: IHostStub; user: IUserStub },
    private dialog: MatDialog,
    private myselfService: MyselfService,
    public dialogRef: MatDialogRef<OptOutDialogComponent>
  ) {}

  ngOnInit(): void {
    const reasonPipe = new OptOutReason();

    //Form to be used for bulk refunds (>1 invoice selected)
    this.optOutForm = new UiForm({
      fields: {
        // Reason for opting out (as a drop-down field)
        opt_out_reason: UiField.Select({
          label: $localize`Reason`,
          values: new Map(
            Object.entries(OptOutOptions).map(([key, value]) => {
              return [key, { label: reasonPipe.transform(value) }];
            })
          )
        }),
        // Additional message to company
        note_to_company: UiField.Textarea({
          label: $localize`Note to Company`
        })
      },
      resolvers: {
        output: async v => {
          this.submitButton.loading = true;
          const optOutReason = {
            reason: v.opt_out_reason,
            message: v.note_to_company
          };
          await this.myselfService.updateOptInStatus(this.data.host._id, 'hard-out', optOutReason);
        }
      },
      handlers: {
        success: async () => {
          this.submitButton.loading = false;
          this.submit.emit();
        }
      }
    });
  }
}
