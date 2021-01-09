import { Component, Input, OnInit, VERSION } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, FormArray } from "@angular/forms";
import {
  GroupControlComponentData,
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
    console.log('--->', this.fg)

  }
}

// import { Component, Input, OnInit } from '@angular/core';
// import { AbstractControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
// import { CustomUiFieldValidator, IUiForm, IUiFormBody, IUiFormField, IUiFormFieldValidator } from '../form.interfaces';

// @Component({
//   selector: 'app-form-body',
//   templateUrl: './form-body.component.html',
//   styleUrls: ['./form-body.component.scss']
// })
// export class FormBodyComponent implements OnInit {
//   @Input() form: IUiFormBody;

//   formGroup:FormGroup

//   constructor() { }

//   ngOnInit(): void {
//     const createFormGroup = (fields: IUiFormField[]): FormGroup => {
//       return this.fb.group(
//         fields.reduce((acc, curr) => {
//           if (curr.type == "container") {
//             acc[curr.field_name] = createFormGroup(curr.fields);
//           } else {
//             acc[curr.field_name] = [
//               { value: curr.default ?? "", disabled: curr.disabled || false },
//               curr.validators?.map((v) => {
//                 switch (v.type) {
//                   case "required":
//                     return Validators.required;
//                   case "email":
//                     return Validators.email;
//                   case "minlength":
//                     return Validators.minLength(v.value as number);
//                   case "maxlength":
//                     return Validators.maxLength(v.value as number);
//                   case "pattern":
//                     return Validators.pattern(v.value as RegExp);
//                   case "custom":
//                     return this.parseCustomValidator.bind(this)(v);
//                 }
//               }),
//             ];
//           }

//           return acc;
//         }, {})
//       );
//     };

//     this.formGroup = createFormGroup(this.form.fields)
//   }

//   parseCustomValidator(field: IUiFormFieldValidator): ValidatorFn {
//     return (control: AbstractControl): { [index: string]: any } | null => {
//       if (!control.parent?.controls) return null;

//       const valid = (field.value as CustomUiFieldValidator)(
//         control,
//         control.parent.controls as { [index: string]: AbstractControl }
//       );

//       return valid
//         ? { [field.type]: field.message(control) || "Invalid message" }
//         : null;
//     };
//   }
// }
