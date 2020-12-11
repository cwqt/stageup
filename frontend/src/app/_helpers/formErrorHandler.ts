import { ICacheable } from "../app.interfaces";
import { IErrorResponse, IFormErrorField } from "@eventi/interfaces";
import { FormGroup } from "@angular/forms";

export const handleFormErrors = (obj: ICacheable<any>, error: IErrorResponse): ICacheable<any> => {
  // Objects pass by reference & reset fields, stay pure please :)
  const o = Object.assign({}, obj);
  o.error = null;

  // Assign does shallow copy, but we want all props from prev obj
  o.form_errors = Object.keys(o.form_errors).reduce(
    (acc, curr) => ({ ...acc, [curr]: null }),
    {}
  );

  // Put general error from message
  o.error = error.message;

  // Map error to each field from response to cacheable form error field
  Object.values(error.errors).forEach((error: IFormErrorField) => {
    if (o.form_errors.hasOwnProperty(error.param)) {
      o.form_errors[error.param] = error.msg;
    }
  });

  return o;
};

export const displayValidationErrors = (formGroup: FormGroup, cacheable: ICacheable<any>) => {
  Object.keys(formGroup.controls).forEach((field) => {
    const control = formGroup.get(field);
    if (cacheable.form_errors[field]) {
      control.setErrors({ incorrect: true });
    }
  });
};

export const formHasValidationErrors = (formGroup:FormGroup):boolean => {
  return Object.keys(formGroup.contains).some(field => {
    return formGroup.get(field).invalid;
  })
}