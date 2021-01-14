import { Component, Input, OnInit, VERSION } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, FormArray } from "@angular/forms";
import {
  IUiFormField,
} from "../form.interfaces";


@Component({
  selector: "ui-form-body",
  templateUrl: "./form-body.component.html",
  styleUrls: ["./form-body.component.scss"],
})
export class FormBodyComponent implements OnInit {
  @Input() fg: FormGroup;
  @Input() fields: IUiFormField[];

  constructor() {

  }

  ngOnInit() {

  }

  fieldIsRequired(field:IUiFormField):boolean {
    return field.validators?.find(f => f.type == "required") ? true : false;
  }

  fieldMaxLength(field:IUiFormField):number {
    const v = field.validators?.find(f => f.type == "maxlength");
    return v ? v.value as number : null;
  }

  fieldMinLength(field:IUiFormField):number {
    const v = field.validators?.find(f => f.type == "minlength");
    return v ? v.value as number : null;
  }
}
