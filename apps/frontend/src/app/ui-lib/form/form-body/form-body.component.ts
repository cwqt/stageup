import { Component, Input, OnInit, VERSION } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormArray } from '@angular/forms';
import { IUiFieldTypeOptions, IUiFormField } from '../form.interfaces';

@Component({
  selector: 'ui-form-body',
  templateUrl: './form-body.component.html',
  styleUrls: ['./form-body.component.scss']
})
export class FormBodyComponent implements OnInit {
  @Input() fg: FormGroup;
  @Input() options: IUiFieldTypeOptions['container'];
  @Input() fields: IUiFormField[];

  constructor() {}

  ngOnInit() {}

  keepOrder = (a, b) => {
    return a;
  };
}
