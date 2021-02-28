import { Injectable } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Injectable({
  providedIn: 'root'
})
export class HelperService {

  constructor() { }

  showDialog<T>(dialogRef: MatDialogRef<any>, callback: (result: T) => void, cancelCallback=(() => {})) {
    const close = fn => { fn(); dialogRef.close(); }

    dialogRef.componentInstance.submit.subscribe(res => close(() => callback(res)));
    dialogRef.componentInstance.cancel.subscribe(() => close(cancelCallback));
    dialogRef.afterClosed().subscribe(result => {
      dialogRef.componentInstance.submit.unsubscribe();
      dialogRef.componentInstance.cancel.unsubscribe();
    });
  }
}
