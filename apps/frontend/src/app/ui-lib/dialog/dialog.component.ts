import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { IUiFormField } from '../form/form.interfaces';
import { UiDialogButton } from './dialog-buttons/dialog-buttons.component';

@Component({
  selector: 'ui-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})
export class DialogComponent implements OnInit {
  @Input() dialogRef: MatDialogRef<any>;
  @Input() buttons: UiDialogButton[];
  @Input() title: string;
  @Input() loading: boolean;

  @Input() small: boolean = true;
  @Input() noPadding: boolean = false;
  @Input() cancel: EventEmitter<string>;

  constructor() {}

  ngOnInit(): void {}
}
