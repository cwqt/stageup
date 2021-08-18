import { Component, EventEmitter, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IPerformance } from '@core/interfaces';
import { AppService } from '@frontend/services/app.service';
import { HelperService } from '@frontend/services/helper.service';
import { PerformanceService } from '@frontend/services/performance.service';
import { ToastService } from '@frontend/services/toast.service';
import { UiDialogButton } from '@frontend/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { IUiDialogOptions } from '@frontend/ui-lib/ui-lib.interfaces';

@Component({
  selector: 'frontend-performance-cancel-dialog',
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
            async deletePerfReason => {
              await this.performanceService
                .deletePerformance(this.performance._id, deletePerfReason)
                .then(() => {
                  this.toastService.emit($localize`Performance Deleted!`);
                  this.toastService.emit($localize`We have initiated refunds for your performance`);
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
