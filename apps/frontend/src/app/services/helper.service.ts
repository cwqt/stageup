import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Except } from 'type-fest';
import {
  DeleteConfirmationDialogComponent,
  IConfirmationDialogData
} from '../components/dialogs/delete-confirmation-dialog/delete-confirmation-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class HelperService {
  constructor() {}

  showConfirmationDialog(dialog: MatDialog, data: IConfirmationDialogData, config: MatDialogConfig<any> = {}) {
    this.showDialog(dialog.open(DeleteConfirmationDialogComponent, { ...config, data: data }));
  }

  showDialog<T>(dialogRef: MatDialogRef<any>, callback?: (result: T) => void, cancelCallback = () => {}) {
    const close = fn => {
      fn();
      dialogRef.close();
    };

    dialogRef.componentInstance.submit.subscribe(res => close(() => callback(res)));
    dialogRef.componentInstance.cancel.subscribe(() => close(cancelCallback));
    dialogRef.afterClosed().subscribe(result => {
      dialogRef.componentInstance.submit.unsubscribe();
      dialogRef.componentInstance.cancel.unsubscribe();
    });
  }
}
