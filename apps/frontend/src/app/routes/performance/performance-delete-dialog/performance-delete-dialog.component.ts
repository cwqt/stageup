import { Component, EventEmitter, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DeletePerfReason, DtoPerformance } from '@core/interfaces';
import { IConfirmationDialogData } from '@frontend/components/dialogs/confirmation-dialog/confirmation-dialog.component';
import { SelectReasonDialogComponent } from '@frontend/components/dialogs/select-reason-dialog/select-reason-dialog.component';
import { HelperService } from '@frontend/services/helper.service';
import { MyselfService } from '@frontend/services/myself.service';
import { ToastService } from '@frontend/services/toast.service';
import { UiDialogButton } from '@frontend/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { IUiDialogOptions, ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-performance-delete-dialog',
  templateUrl: './performance-delete-dialog.component.html',
  styleUrls: ['./performance-delete-dialog.component.css']
})
export class PerformanceDeleteDialogComponent implements OnInit, IUiDialogOptions {
  submit: EventEmitter<string> = new EventEmitter();
  cancel: EventEmitter<string> = new EventEmitter();
  buttons?: UiDialogButton[];

  constructor(
    private toastService: ToastService,
    private myselfService: MyselfService,
    private ref: MatDialogRef<PerformanceDeleteDialogComponent>,
    private helperService: HelperService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: DtoPerformance
  ) {}

  ngOnInit(): void {
    this.buttons = [
      new UiDialogButton({
        label: $localize`Cancel`,
        kind: ThemeKind.Secondary,
        callback: () => {
          this.cancel.emit();
          this.ref.close();
        }
      }),
      new UiDialogButton({
        label: $localize`Delete Performance`,
        kind: ThemeKind.Primary,
        callback: () =>
          this.helperService.showDialog(
            this.dialog.open(SelectReasonDialogComponent, {
              data: {
                dialog_title: $localize`Why do you want to delete the performance?`,
                reasons: new Map([
                  [DeletePerfReason.TechnicalIssues, { label: $localize`Technical Issues` }],
                  [
                    DeletePerfReason.CancelledResceduled,
                    { label: $localize`Original performance got cancelled/rescheduled` }
                  ],
                  [DeletePerfReason.Covid19, { label: $localize`COVID-19` }],
                  [DeletePerfReason.TooFewSold, { label: $localize`Did not sell enough tickets` }],
                  [
                    DeletePerfReason.PoorUserExperience,
                    { label: $localize`Did not like the user experience on StageUp` }
                  ],
                  [DeletePerfReason.Other, { label: $localize`Other, please specify below:` }]
                ]),
                hide_further_info: currentSelection => currentSelection != DeletePerfReason.Other
              }
            }),
            () => {}
          )
      })
    ];
  }
}
