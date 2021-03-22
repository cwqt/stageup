import { Component, Input, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { IUiFormField } from '../form/form.interfaces';

@Component({
  selector: 'ui-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})
export class DialogComponent implements OnInit {
  @Input() dialogRef:MatDialogRef<any>;
  @Input() buttons;
  @Input() title:string;
  @Input() loading:boolean;

  @Input() noPadding:boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

}
