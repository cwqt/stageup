import { Component, Inject, OnInit, Output, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { IUiDialogOptions } from '../../../ui-lib/ui-lib.interfaces';

export interface IConfirmationDialogData {
  title: string;
  description?: string;
  buttons: IUiDialogOptions['buttons'];
  loading?: Observable<boolean>;
}

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent implements OnInit, IUiDialogOptions {
  @Output() submit = new EventEmitter();
  @Output() cancel = new EventEmitter();
  buttons: IUiDialogOptions['buttons'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: IConfirmationDialogData
  ) {}

  ngOnInit(): void {
    this.buttons = this.data.buttons;
  }
}
