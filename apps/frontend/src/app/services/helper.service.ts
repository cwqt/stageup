import { Injectable, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { IUiDialogOptions } from '@frontend/ui-lib/ui-lib.interfaces';
import {
  ConfirmationDialogComponent,
  IConfirmationDialogData
} from '../components/dialogs/confirmation-dialog/confirmation-dialog.component';

type EventEmitterType<T> = T extends EventEmitter<infer U> ? U : never;

@Injectable({
  providedIn: 'root'
})
export class HelperService {
  constructor() {}

  showConfirmationDialog<T>(dialog: MatDialog, data: IConfirmationDialogData, config: MatDialogConfig<any> = {}, callback?: (result: T) => void, cancelCallback = () => {}) {
    this.showDialog(dialog.open(ConfirmationDialogComponent, { ...config, data: data }), callback, cancelCallback);
  }

  showDialog<T extends Partial<IUiDialogOptions>>(
    dialogRef: MatDialogRef<T>,
    onSubmit?: (result: EventEmitterType<T['submit']>) => void,
    onCancel?: (result: EventEmitterType<T['cancel']>) => void
  ) {
    const close = fn => {
      fn();
      dialogRef.close();
    };

    dialogRef.componentInstance?.submit?.subscribe(res => close(() => onSubmit?.(res)));
    dialogRef.componentInstance?.cancel?.subscribe(() => close(onCancel));
    dialogRef.afterClosed().subscribe(() => {
      dialogRef.componentInstance?.submit?.unsubscribe();
      dialogRef.componentInstance?.cancel?.unsubscribe();
    });
  }
}
