import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  ViewChildren,
  AfterViewInit,
  QueryList
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { Y } from '@core/interfaces';
import { ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { displayValidationErrors, handleFormErrors } from 'apps/frontend/src/app/_helpers/formErrorHandler';
import { ButtonComponent } from '../button/button.component';

import {
  CustomUiFieldValidator,
  IUiForm,
  IUiFormFieldValidator,
  IUiFormPrefetchData
} from './form.interfaces';

@Component({
  selector: 'ui-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit, AfterViewInit {
  @Input() cacheable: ICacheable<any>;
  @Input() form: IUiForm<any>;

  @Output() onSuccess: EventEmitter<any> = new EventEmitter();
  @Output() onFailure: EventEmitter<HttpErrorResponse> = new EventEmitter();
  @Output() onChange: EventEmitter<FormGroup> = new EventEmitter();

  @ViewChildren(ButtonComponent) buttons: QueryList<ButtonComponent>;

  formGroup: FormGroup;
  submissionButton: ButtonComponent;
  shouldBeVisible: boolean = false;

  constructor(private fb: FormBuilder) {}

  async ngOnInit() {
    this.formGroup = Y<any, FormGroup>(r => (fields: IUiForm<any>['fields']): FormGroup => {
      return this.fb.group(
        Object.entries(fields).reduce((acc, curr) => {
          const [field_name, field] = curr;
          if (field.type == 'container') {
            acc[field_name] = r(field.fields);
          } else {
            acc[field_name] = [
              {
                value: field.initial ?? '',
                disabled: field.disabled || false
              },
              field.validators?.map(v => {
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
                    return this.parseCustomValidator.bind(this)(v);
                }
              })
            ];
          }

          return acc;
        }, {})
      );
    })(this.form.fields);

    this.formGroup.valueChanges.subscribe(v => this.onChange.emit(this.formGroup));
  }

  ngAfterViewInit() {
    // Form is hidden by CSS, but active in the DOM - isn't shown until shouldBeVisible == true
    // which is after the prefetch populate has been completed (if any)
    this.submissionButton = this.buttons.find(b => b.type == 'submit');
    if (!this.submissionButton) throw new Error('Form has no button of type "submit"');

    this.formGroup.statusChanges.subscribe(v => {
      if (v == 'VALID') {
        this.cacheable.error = ''; // form errors gone
        this.submissionButton.disabled = false;
      } else {
        this.submissionButton.disabled = true;
      }
    });

    setTimeout(() => {
      this.submissionButton.disabled = true;
      if (this.form.prefetch) {
        this.populatePrefetch().finally(() => {
          this.shouldBeVisible = true;
        });
      } else {
        this.shouldBeVisible = true;
      }
    }, 0);
  }

  /**
   * @description populate a form with requested values before user input
   */
  populatePrefetch() {
    return this.form
      .prefetch()
      .then((data: IUiFormPrefetchData) => {
        //https://angular.io/api/forms/AbstractControl#setErrors
        // is nice enough to let us use dot accessors, so no Y combis :<
        const { fields, errors } = data;

        // Set form control default value
        Object.entries(fields).forEach(([f, v]) => this.formGroup.get(f)?.setValue(v));

        // Set form control errors by bodging validator to show message
        // if value is the same as it was prefetched
        Object.entries(errors).forEach(([f, v]) => {
          const control = this.formGroup.get(f);
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

        this.formGroup.markAllAsTouched();
      })
      .catch(e => console.log(e))
  }

  getValue() {
    const formValue = this.formGroup.value;
    // TODO: before data structure transformer, recurse down tree & perform field level transformers

    // Restructure the data according to some transformer
    if(this.form.submit.transformer) return this.form.submit.transformer(formValue);
    return formValue;
  }

  onSubmit() {
    this.cacheable.loading = true;
    Object.values(this.formGroup.controls).forEach(i => i.disable());
    this.submissionButton.loading = true;

    this.form.submit
      .handler(this.getValue())
      .then(v => this.onSuccess.emit(v))
      .catch((e: HttpErrorResponse) => {
        this.cacheable = handleFormErrors(this.cacheable, e.error);
        displayValidationErrors(this.formGroup, this.cacheable);
        this.onFailure.emit(e);
      })
      .finally(() => {
        Object.values(this.formGroup.controls).forEach(i => i.enable());
        this.cacheable.loading = false;
        this.submissionButton.loading = false;
      });
  }

  parseCustomValidator(field: IUiFormFieldValidator): ValidatorFn {
    return (control: AbstractControl): { [index: string]: any } | null => {
      if (!control.parent?.controls) return null;

      const isValid = (field.value as CustomUiFieldValidator)(
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
