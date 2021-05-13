import { AbstractControl, FormBuilder, FormGroup, NgControl, ValidatorFn, Validators } from '@angular/forms';
import { MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { DottedPaths, Primitive, Y } from '@core/interfaces';
import { CurrencyCode } from 'aws-sdk/clients/devicefarm';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { createICacheable, ICacheable } from '../../app.interfaces';
import { IErrorResponse, IFormErrorField } from '@core/interfaces';
import { HttpErrorResponse } from '@angular/common/http';

// Reactive Form Builder v2

export interface IUiFormResolver<Output, Input, Fields> {
  input?: () => Promise<{
    fields?: { [index in keyof Fields]?: Primitive | Date };
    errors?: { [index in keyof Fields]?: string[] };
  }>;
  output: (v: { [index in keyof Fields]: any }) => Promise<Output>;
}

/**
 * @param submit, T => submit handler return type
 */
export interface IUiForm<Output = any, Input = any, K = { [index: string]: IUiFormField }> {
  fields: K; // form fields
  resolvers: IUiFormResolver<Output, Input, K>;
}

export class UiForm<Output = any, Input = any, K = { [index: string]: IUiFormField }> {
  private subscription: Subscription;
  private $loading: BehaviorSubject<boolean>;
  private resolvers: IUiFormResolver<Output, Input, K>;
  private handlers?: {
    success?: (v: Output, f?: FormGroup) => Promise<void>;
    failure?: (v: IErrorResponse, f?: FormGroup) => Promise<void>;
    changes?: (v: FormGroup) => Promise<void>;
  };

  group: FormGroup;
  fields: K;
  cache: ICacheable<Output>;
  loading: Observable<boolean>;

  constructor(
    data: {
      fields: K;
      resolvers: IUiFormResolver<Output, Input, K>;
      handlers?: {
        success?: (v: Output, f?: FormGroup) => Promise<void>;
        failure?: (v: IErrorResponse, f?: FormGroup) => Promise<void>;
        changes?: (v: FormGroup) => Promise<void>;
      };
    },
    cache?: ICacheable<Output>
  ) {
    this.fields = data.fields;
    this.resolvers = data.resolvers;
    this.handlers = data.handlers;
    this.$loading = new BehaviorSubject(false);
    this.loading = this.$loading.asObservable();
    this.cache = cache || createICacheable();

    this.group = this.create();

    if (this.handlers?.changes)
      this.subscription = this.group.valueChanges.subscribe(() => this.handlers.changes(this.group));

    if (this.resolvers.input) this.populatePrefetch();
  }

  async wrap(fn: Function) {
    // Stop infinite loops from handler.changes() calling submit()
    if (this.$loading.value == true) return;

    // Set all the loading states
    this.$loading.next(true);
    this.cache.loading = true;
    this.group.disable();

    try {
      return await fn();
    } catch (error) {
    } finally {
      this.group.enable();
      this.cache.loading = false;
      this.$loading.next(false);
    }
  }

  async submit(): Promise<Output> {
    return this.wrap(async () => {
      try {
        const value = await this.resolvers.output(this.group.getRawValue());
        if (this.handlers?.success) this.handlers.success(value, this.group);
        return value;
      } catch (error) {
        if (error instanceof HttpErrorResponse && error.error.status) {
          const res: IErrorResponse = error.error;
          // Put the form error message in the Cachable
          this.cache.error = res.message || null;

          // Map into ICacheable FormError
          this.cache.form_errors = res.errors.reduce((acc, curr) => {
            if (!acc[curr.path]) acc[curr.path] = [];
            acc[curr.path].push([curr.code, curr.message]);
            return acc;
          }, {});

          // And then set the errors on the controls
          Object.entries(this.cache.form_errors).forEach(([path, errors]) => {
            const control = this.group.get(path);
            if (control) {
              // https://github.com/angular/angular/issues/19170#issuecomment-435576250
              setTimeout(() => {
                control.markAsDirty();
                control.markAsTouched();
                control.setErrors({ backendIssue: errors.reduce((acc, curr) => ((acc += `${curr[1]}\n`), acc), '') });
              }, 1);
            }
          });

          if (this.handlers?.failure) return this.handlers.failure(res, this.group);
        }
      }
    });
  }

  destroy() {
    this.subscription?.unsubscribe();
  }

  private create(): FormGroup {
    const fb = new FormBuilder();

    return Y<any, FormGroup>(r => (fields: IUiForm<Output, Input, K>['fields']): FormGroup => {
      return fb.group(
        Object.entries(fields).reduce((acc, curr) => {
          const [field_name, field] = curr;
          if (field.type == 'container') {
            acc[field_name] = r(field.options.fields);
          } else {
            acc[field_name] = [
              {
                value: field.options.initial ?? '',
                disabled: field.options.disabled || false
              },
              field.options.validators?.map((v: IUiFormFieldValidator) => {
                switch (v.type) {
                  case 'required':
                    return Validators.required;
                  case 'email':
                    return Validators.email;
                  case 'minlength':
                    return Validators.minLength(v.value as number);
                  case 'maxlength':
                    return Validators.maxLength(v.value as number);
                  case 'pattern':
                    return Validators.pattern(v.value as RegExp);
                  case 'custom':
                    return this.parseCustomValidator(v);
                }
              })
            ];
          }

          return acc;
        }, {})
      );
    })(this.fields);
  }

  /**
   * @description populate a form with requested values before user input
   */
  async populatePrefetch() {
    return this.wrap(async () => {
      return this.resolvers
        .input()
        .then(data => {
          //https://angular.io/api/forms/AbstractControl#setErrors
          // is nice enough to let us use dot accessors, so no Y combis :<
          if (data) {
            const { fields, errors } = data;

            // Set form control default value
            Object.entries(fields).forEach(([f, v]) => this.group.get(f)?.setValue(v));

            // Set form control errors by bodging validator to show message
            // if value is the same as it was prefetched
            if (errors) {
              Object.entries(errors).forEach(([f, v]) => {
                const control = this.group.get(f);
                if (control) {
                  control.setValidators(
                    this.parseCustomValidator({
                      type: 'custom',
                      value: c => c.value != fields[f],
                      message: e => `${v}`
                    })
                  );
                  control.updateValueAndValidity();
                  control.markAsTouched();
                }
              });
            }

            this.group.markAllAsTouched();
          }
        })
        .catch(e => console.error(e))
        .finally(() => this.$loading.next(false));
    });
  }

  private parseCustomValidator(field: IUiFormFieldValidator): ValidatorFn {
    return (control: AbstractControl): { [index: string]: any } | null => {
      if (!control.parent?.controls) return null;

      const isValid = (field['value'] as CustomUiFieldValidator)(
        control,
        control.parent.controls as { [index: string]: AbstractControl }
      );

      return isValid
        ? null
        : {
            [field.type]: field.message ? field.message(control) : 'Invalid body'
          };
    };
  }
}

// Identify function map
export const UiField: {
  [index in IUiFieldType as Capitalize<index>]?: (
    options: IUiFieldTypeOptions[index] & IUiFieldOptions
  ) => IUiFormField; // <index> // does not like this;
} = {
  Container: options => ({ type: 'container', options }),
  Text: options => ({ type: 'text', options }),
  Radio: options => ({ type: 'radio', options }),
  Richtext: options => ({ type: 'richtext', options }),
  Money: options => ({ type: 'money', options }),
  Password: options => ({ type: 'password', options }),
  Phone: options => ({ type: 'phone', options }),
  Textarea: options => ({ type: 'textarea', options }),
  Select: options => ({ type: 'select', options }),
  Number: options => ({ type: 'number', options }),
  Checkbox: options => ({ type: 'checkbox', options }),
  Datetime: options => ({ type: 'datetime', options }),
  Date: options => ({ type: 'date', options }),
  Time: options => ({ type: 'time', options })
} as const;

export interface IUiFormData {
  group: FormGroup;
  layout: { [index: string]: IUiFormField };
}

export type IUiFormField<T extends IUiFieldType = any> = {
  type: T;
  options: IUiFieldOptions & IUiFieldTypeOptions[T];
};

/**
 * v--------- width -------------v
 *
 * label
 * +-----------------------------+
 * | placeholder                 |
 * +-----------------------------+
 *  hint               validators
 */

export interface IUiFieldOptions {
  label?: string;
  hint?: string;
  hide?: (f: FormGroup) => boolean;
  disabled?: boolean;
  width?: number;
  validators?: IUiFormFieldValidator[];
  hide_footer?: boolean;
  separator?: 'above' | 'below';
  maps_to?: string;
}

export type IUiFieldTypeReturn<K = { [index: string]: IUiFormField['type'] }> = {
  container: { [index in keyof K]: K[index] };
  text: string;
  textarea: string;
  select: Primitive;
  // money: number;
  date: Date;
  radio: Primitive;
  number: number;
  password: string;
  checkbox: boolean;
  time: number;
  phone: number;
};

export type IUiFieldTypeOptions = {
  container: {
    header_level?: 1 | 2 | 3 | 4 | 5 | 6 | null | 0; // 0 == label, null == h2
    fields: { [index: string]: IUiFormField };
  };
  text: {
    initial?: string;
    mask?: IUiFieldMaskOptions;
    placeholder?: string;
  };
  textarea: {
    initial?: string;
    rows?: number;
    placeholder?: string;
  };
  richtext: {};
  select: {
    initial?: Primitive;
    values: Map<Primitive, { label: string; disabled?: boolean }>;
    multi_select?: boolean;
    has_search?: boolean;
    placeholder?: string;
  };
  money: {
    currency: CurrencyCode;
    placeholder?: string;
  };
  date: {
    is_date_range?: boolean;
    min_date?: Date;
    max_date?: Date;
    date_highlighter?: MatCalendarCellClassFunction<Date>;
  };
  radio: {
    initial?: Primitive;
    inline?: boolean;
    values: Map<Primitive, { label: string; disabled?: boolean }>;
  };
  number: {
    placeholder?: string;
    initial?: number;
  };
  password: {
    placeholder?: string;
  };
  checkbox: {
    initial?: boolean;
  };
  time: {
    placeholder?: string;
    initial?: 0;
  };
  datetime: {
    is_date_range?: boolean;
    min_date?: Date;
    max_date?: Date;
    date_highlighter?: MatCalendarCellClassFunction<Date>;
  };
  phone: {
    placeholder?: string;
  };
};

export type IUiFieldType = keyof IUiFieldTypeOptions;

export interface IUiFieldMaskOptions {
  prefix?: string;
  suffix?: string;
  value: string;
}

// Discriminated unions work on non-nested objects :)
export type IUiFormFieldValidator = {
  message?: (e: NgControl | AbstractControl) => string;
} & (
  | {
      type: 'required';
    }
  | {
      type: 'pattern';
      value: RegExp;
    }
  | {
      type: 'minlength';
      value: number;
    }
  | {
      type: 'maxlength';
      value: number;
    }
  | {
      type: 'custom';
      value: CustomUiFieldValidator;
    }
  | {
      type: 'email';
    }
);

/**
 * @description self; control of this input
 */
export type CustomUiFieldValidator = (
  self: AbstractControl,
  formControls?: { [index: string]: AbstractControl }
) => boolean;
