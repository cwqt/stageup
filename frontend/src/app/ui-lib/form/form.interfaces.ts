import { AbstractControl, FormGroup, NgControl } from "@angular/forms";
import { Primitive } from "@eventi/interfaces";
import { ICacheable } from "src/app/app.interfaces";
import { IFlatGraphNode } from "../input/input.component";

/**
 * @param submit, T => submit handler return type
 */
export interface IUiForm<T> {
  fields: IUiFormField[]; // form fields
  submit: IUiFormSubmit<T>; // what to do on submit
}

export interface IUiFormField {
  type: "number" | "text" | "password" | "textarea" | "checkbox" | "select" | "phone" | "container";
  field_name: string;
  variant?: "primary" | "secondary";
  label?: string;
  initial?: Primitive;
  validators?: IUiFormFieldValidator[];
  hint?: string;
  fields?: IUiFormField[]; // for nested objects
  width?: number; //for containers

  options?: IUiFieldSelectOptions | any;

  // internal ----------------------
  disabled?: boolean;
  errors?: string[];
}

export interface IUiFieldSelectOptions {
  values: Omit<IFlatGraphNode, "level" | "expandable">[];
  multi: boolean;
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