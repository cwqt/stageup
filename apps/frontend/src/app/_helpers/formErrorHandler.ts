import { ICacheable } from "../app.interfaces";
import { IErrorResponse, IFormErrorField, Y } from "@eventi/interfaces";
import { FormGroup } from "@angular/forms";

export const handleFormErrors = (
  obj: ICacheable<any>,
  error: IErrorResponse
): ICacheable<any> => {
  // Objects pass by reference & reset fields, stay pure please :)
  const o = Object.assign({}, obj);
  o.error = null;

  // Assign does shallow copy, but we want all props from prev obj
  o.form_errors = Object.keys(o.form_errors).reduce(
    (acc, curr) => ({ ...acc, [curr]: null }),
    {}
  );

  // Put the form error message in the Cachable
  o.error = error.message;

  // Recursively map the error response to a KV param:ErrCode object
  o.form_errors = Y<IFormErrorField[][], typeof o.form_errors>((r) => (f) => {
    return f.reduce((acc, curr) => {
      if (curr.nestedErrors?.length > 0) {
        acc[curr.param] = r(curr.nestedErrors);
      } else {
        acc[curr.param] = curr.code;
      }
      return acc;
    }, {});
  })(error.errors);

  return o;
};

export const displayValidationErrors = (
  formGroup: FormGroup,
  cacheable: ICacheable<any>
) => {
  // Recursively go through the controls setting the error messages
  Y<[FormGroup, string], void>(r => (fg, path) => {
    Object.keys(fg.controls).forEach((f) => {
      const control = fg.get(f);
      const i = path ? path + `.${f}` : f; // make a.b.c.d for object path
      // Get error by path, if one exists in the cacheable form errors
      const e = i.split(".").reduce((acc, val) => acc && acc[val], cacheable.form_errors);
      if(e && typeof(e) == "string") {
        control.setErrors({ backendIssue: e });
        control.markAsTouched(); // trigger change detection
      };
      if((control as FormGroup).controls) r(control as FormGroup, i);
    });
  })(formGroup, null);
};

export const formHasValidationErrors = (formGroup: FormGroup): boolean => {
  return Object.keys(formGroup.contains).some((field) => {
    return formGroup.get(field).invalid;
  });
};
