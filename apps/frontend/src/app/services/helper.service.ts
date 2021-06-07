import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Except } from 'type-fest';
import {
  ConfirmationDialogComponent,
  IConfirmationDialogData
} from '../components/dialogs/confirmation-dialog/confirmation-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class HelperService {
  constructor() {}

  showConfirmationDialog<T>(dialog: MatDialog, data: IConfirmationDialogData, config: MatDialogConfig<any> = {}, callback?: (result: T) => void, cancelCallback = () => {}) {
    this.showDialog(dialog.open(ConfirmationDialogComponent, { ...config, data: data }), callback, cancelCallback);
  }

  showDialog<T>(dialogRef: MatDialogRef<any>, callback?: (result: T) => void, cancelCallback = () => {}) {
    const close = fn => {
      fn();
      dialogRef.close();
    };

    dialogRef.componentInstance?.submit?.subscribe(res => close(() => callback?.(res)));
    dialogRef.componentInstance?.cancel?.subscribe(() => close(cancelCallback));
    dialogRef.afterClosed().subscribe(result => {
      dialogRef.componentInstance?.submit?.unsubscribe();
      dialogRef.componentInstance?.cancel?.unsubscribe();
    });
  }
}
