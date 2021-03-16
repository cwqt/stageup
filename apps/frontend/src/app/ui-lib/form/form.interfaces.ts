import { AbstractControl, NgControl } from '@angular/forms';
import { CurrencyCode, DottedPaths, Primitive } from '@core/interfaces';
import { IGraphNode } from '../input/input.component';

/**
 * @param submit, T => submit handler return type
 */
export interface IUiForm<T> {
  fields: { [index: string]: IUiFormField }; // form fields
  submit: IUiFormSubmit<T>; // what to do on submit
  prefetch?: (mapping?: { [index: string]: string }) => Promise<IUiFormPrefetchData>; //populate form from object
}

export interface IUiFormPrefetchData<T = any> {
  fields: { [index in DottedPaths<T>]: string };
  errors?: { [index in DottedPaths<T>]: string[] };
}

export interface IUiFormField {
  type:
    | 'number'
    | 'text'
    | 'password'
    | 'textarea'
    | 'checkbox'
    | 'select'
    | 'money'
    | 'date'
    | 'time'
    | 'phone'
    | 'radio'
    | 'container';
  variant?: 'primary' | 'secondary';
  label?: string;
  initial?: Primitive;
  placeholder?: string;
  validators?: IUiFormFieldValidator[];
  hint?: string;
  fields?: IUiForm<any>['fields']; // for nested objects
  width?: number;

  // ui-input options
  options?:
    | IUiFieldSelectOptions
    | IUiFieldTextOptions
    | IUiFieldMoneyOptions
    | IUIFieldRadioOptions
    | IUiFieldContainerOptions
    | any;

  // internal ----------------------
  disabled?: boolean;
  errors?: string[];
}

export interface IMaskOptions {
  prefix?: string;
  suffix?: string;
  value: string;
}

export interface IUiFieldContainerOptions {
  header_level: 1 | 2 | 3 | 4 | 5 | 6 | null | 0; // 0 == label, null == h2
}

export interface IUIFieldRadioOptions {
  inline?: boolean;
  values: Array<{ key: string; value: string }>;
}

export interface IUiFieldMoneyOptions {
  currency: CurrencyCode;
}

export interface IUiFieldOptions {
  width?: number; //for containers
}

export interface IUiFieldTextOptions extends IUiFieldOptions {
  mask?: IMaskOptions;
  transformer?: (v: Primitive) => Primitive;
}
export interface IUiFieldSelectOptions extends IUiFieldOptions {
  values: Array<{ key: Primitive, value: Primitive, disabled?:boolean }>;
  multi?: boolean;
  search?: boolean;
}
export interface IUiFormFieldValidator {
  type: 'required' | 'pattern' | 'minlength' | 'maxlength' | 'email' | 'custom';
  value?: number | string | RegExp | CustomUiFieldValidator;
  message?: (e: NgControl | AbstractControl) => string;
}

export type CustomUiFieldValidator = (
  thisControl: AbstractControl,
  formControls?: { [index: string]: AbstractControl }
) => boolean;

export interface IUiFormSubmit<T> {
  text: string;
  variant: 'primary' | 'secondary';
  size?: 's' | 'm' | 'l';
  is_hidden?: boolean;
  loading_text?: string;
  handler: (transformedData: any) => Promise<T>;
  transformer?: (formData: AbstractControl['value']) => any;
}
