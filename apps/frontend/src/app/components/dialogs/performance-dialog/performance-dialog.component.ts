// Modal Component to display information about a performance

import { Component, OnInit, Inject, Output, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IPerformanceStub } from '@core/interfaces';
import { RegisterComponent } from '../../../routes/landing/register/register.component';
import { HelperService } from '../../../services/helper.service';
import { IUiDialogOptions } from '../../../ui-lib/ui-lib.interfaces';

@Component({
  selector: 'performance-dialog',
  templateUrl: './performance-dialog.component.html',
  styleUrls: ['./performance-dialog.component.scss']
})
export class PerformanceDialogComponent implements OnInit, IUiDialogOptions {
  @Output() submit = new EventEmitter();
  @Output() cancel = new EventEmitter();
  buttons = [];

  constructor(
    private helperService:HelperService,
    private dialog:MatDialog,
    public dialogRef: MatDialogRef<PerformanceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IPerformanceStub
  ) {}

  ngOnInit() {
  }

  openRegister() {
    this.helperService.showDialog(this.dialog.open(RegisterComponent), () => {})
  }
}
