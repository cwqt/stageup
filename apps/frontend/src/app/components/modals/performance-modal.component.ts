// Modal Component to display information about a performance

import { Component, OnInit, Inject, Output, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IPerformanceStub } from '@core/interfaces';
import { IUiDialogOptions } from '../../ui-lib/ui-lib.interfaces';

@Component({
  selector: 'performance-modal',
  templateUrl: './performance-modal.component.html',
  styleUrls: ['./performance-modal.component.scss']
})
export class PerformanceModalComponent implements OnInit, IUiDialogOptions {
  @Output() submit = new EventEmitter();
  @Output() cancel = new EventEmitter();
  buttons = [];

  constructor(
    public dialogRef: MatDialogRef<PerformanceModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IPerformanceStub
  ) {}

  ngOnInit() {
  }
}
