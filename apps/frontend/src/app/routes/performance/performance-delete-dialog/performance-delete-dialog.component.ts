import { Component, EventEmitter, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DtoPerformance } from '@core/interfaces';
import { IConfirmationDialogData } from '@frontend/components/dialogs/confirmation-dialog/confirmation-dialog.component';
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
  submit: EventEmitter<any>;
  cancel: EventEmitter<any>;
  buttons?: UiDialogButton[];

  constructor(
    private toastService: ToastService,
    private myselfService: MyselfService,
    private ref: MatDialogRef<PerformanceDeleteDialogComponent>,
    private helperService: HelperService,
    @Inject(MAT_DIALOG_DATA) public data: DtoPerformance
  ) {}

  ngOnInit(): void {
    console.log(this.data.data);

    // let confirmDialogData: IConfirmationDialogData = {
    //   title: $localize`Confirm refund`,

    // };
    this.buttons = [
      new UiDialogButton({
        label: $localize`Cancel`,
        kind: ThemeKind.Secondary,
        callback: () => this.cancel.emit()
      }),
      new UiDialogButton({
        label: $localize`Delete Performance`,
        kind: ThemeKind.Primary,
        callback: () => this.helperService.showDialog(this.dialog)
      })
    ];
  }
}
