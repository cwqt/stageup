// Modal Component to display information about a performance

import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/Dialog';
import { DialogData } from './../../routes/feed/DialogData';

@Component({
  selector: 'performance-modal', 
  templateUrl: './performance-modal.component.html',
  styleUrls: ['./performance-modal.component.scss']
})
export class PerformanceModalComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<PerformanceModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
  }
  
}