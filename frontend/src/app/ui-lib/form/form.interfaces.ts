import { AbstractControl, FormGroup, NgControl } from "@angular/forms";
import { ICacheable } from "src/app/app.interfaces";


export interface GroupControlComponentData {
  conjunctor?: null;
  conditions: ConditionFormComponentData[];
  groups: GroupControlComponentData[];
}

export interface ConditionFormComponentData {
  variable: any;
  field?: IUiFormField;
}
/**
 * @param submit, T => submit handler return type
 */
export interface IUiForm<T> {
  fields: IUiFormField[]; // form fields
  submit: IUiFormSubmit<T>; // what to do on submit
}

export interface IUiFormField {
  type: "number" | "text" | "password" | "textarea" | "checkbox" | "container";
  field_name: string;
  variant?: "primary" | "secondary";
  label?: string;
  default?: string | boolean;
  validators?: IUiFormFieldValidator[];
  hint?: string;
  fields?: IUiFormField[]; // for nested objects
  width?: number; //for containers

  // internal ----------------------
  parentFg?:FormGroup;
  disabled?: boolean;
  errors?: string[];
}

export interface IUiFormFieldValidator {
  type: "required" | "pattern" | "minlength" | "maxlength" | "email" | "custom";
  value?: number | string | RegExp | CustomUiFieldValidator;
  message?: (e: NgControl | AbstractControl) => string;
}

export type CustomUiFieldValidator = (
  thisControl: AbstractControl,
  formControls?: { [index: string]: AbstractControl }
) => boolean;

export interface IUiFormSubmit<T> {
  variant: "primary" | "secondary";
  size?: "s" | "m" | "l";
  text: string;
  loadingText?: string;
  fullWidth?: boolean;
  handler: (formData: AbstractControl["value"]) => Promise<T>;
}