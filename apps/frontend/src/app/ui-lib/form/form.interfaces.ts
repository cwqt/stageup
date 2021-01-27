import { AbstractControl, FormGroup, NgControl } from "@angular/forms";
import { DottedPaths, Primitive } from "@eventi/interfaces";
import { ICacheable } from "apps/frontend/src/app/app.interfaces";
import { IGraphNode } from "../input/input.component";

/**
 * @param submit, T => submit handler return type
 */
export interface IUiForm<T> {
  fields: { [index:string]:IUiFormField }; // form fields
  submit: IUiFormSubmit<T>; // what to do on submit
  prefetch?: (mapping?: { [index: string]: string }) => Promise<IUiFormPrefetchData>; //populate form from object
}

export interface IUiFormPrefetchData<T = any> {
  fields: {[index in DottedPaths<T>]:string};
  errors?: {[index in DottedPaths<T>]:string};
}

export interface IUiFormField {
  type:
    | "number"
    | "text"
    | "password"
    | "textarea"
    | "checkbox"
    | "select"
    | "tree"
    | "phone"
    | "container";
  variant?: "primary" | "secondary";
  label?: string;
  initial?: Primitive;
  placeholder?: string;
  validators?: IUiFormFieldValidator[];
  hint?: string;
  fields?: IUiForm<any>["fields"]; // for nested objects

  options?: IUiFieldSelectOptions | IUiFieldTextOptions | any;

  // internal ----------------------
  disabled?: boolean;
  errors?: string[];
}

export interface IMaskOptions {
  prefix?: string;
  suffix?: string;
  value: string;
}

export interface IUiFieldOptions {
  width?: number; //for containers
}
export interface IUiFieldTextOptions extends IUiFieldOptions {
  mask?: IMaskOptions;
  transformer?: (v:Primitive) => Primitive;
}
export interface IUiFieldSelectOptions extends IUiFieldOptions {
  values: Omit<IGraphNode, "level" | "expandable" | "icon">[];
  multi: boolean;
  search: boolean;
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
