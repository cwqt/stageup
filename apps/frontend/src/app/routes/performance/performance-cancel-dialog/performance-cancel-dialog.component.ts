import { Component, EventEmitter, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RemovalReason, IPerformance, RemovalType } from '@core/interfaces';
import { SelectReasonDialogComponent } from '@frontend/components/dialogs/select-reason-dialog/select-reason-dialog.component';
import { AppService } from '@frontend/services/app.service';
import { HelperService } from '@frontend/services/helper.service';
import { PerformanceService } from '@frontend/services/performance.service';
import { ToastService } from '@frontend/services/toast.service';
import { UiDialogButton } from '@frontend/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { IUiDialogOptions, ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-performance-cancel-dialog',
  templateUrl: './performance-cancel-dialog.component.html',
  styleUrls: ['./performance-cancel-dialog.component.css']
})
export class PerformanceCancelDialogComponent implements OnInit, IUiDialogOptions {
  submit: EventEmitter<string> = new EventEmitter();
  cancel: EventEmitter<string> = new EventEmitter();
  buttons?: UiDialogButton[];

  constructor(
    private toastService: ToastService,
    private ref: MatDialogRef<PerformanceCancelDialogComponent>,
    private performanceService: PerformanceService,
    private helperService: HelperService,
    private dialog: MatDialog,
    private appService: AppService,
    @Inject(MAT_DIALOG_DATA) public performance: IPerformance
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
        label: $localize`Cancel Performance`,
        kind: ThemeKind.Primary,
        callback: () =>
          this.helperService.showDialog(
            this.dialog.open(SelectReasonDialogComponent, {
              data: {
                dialog_title: $localize`Why do you want to cancel the performance?`,
                reasons: new Map([
                  [RemovalReason.TechnicalIssues, { label: $localize`Technical Issues` }],
                  [
                    RemovalReason.CancelledResceduled,
                    { label: $localize`Original performance got cancelled/rescheduled` }
                  ],
                  [RemovalReason.Covid19, { label: $localize`COVID-19` }],
                  [RemovalReason.TooFewSold, { label: $localize`Did not sell enough tickets` }],
                  [RemovalReason.PoorUserExperience, { label: $localize`Did not like the user experience on StageUp` }],
                  [RemovalReason.Other, { label: $localize`Other, please specify below:` }]
                ]),
                hide_further_info: currentSelection => currentSelection != RemovalReason.Other
              }
            }),
            async cancelPerfReason => {
              await this.performanceService
                .deletePerformance(this.performance._id, {
                  removal_reason: cancelPerfReason,
                  removal_type: RemovalType.Cancel
                })
                .then(() => {
                  this.toastService.emit(
                    $localize`${this.performance.name} Cancelled! We have initiated refunds for all purchased tickets`
                  );
                })
                .then(() => {
                  this.appService.navigateTo('/dashboard/performances');
                  this.ref.close();
                })
                .catch(err => this.toastService.emit(err.message, ThemeKind.Danger));
            }
          )
      })
    ];
  }
}
