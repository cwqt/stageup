import { Component, Input, OnInit } from '@angular/core';
import { IUiFormField } from '../form/form.interfaces';

@Component({
  selector: 'ui-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})
export class DialogComponent implements OnInit {
  @Input() buttons
  @Input() title:string;
  @Input() loading:boolean;

  @Input() noPadding:boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

}
