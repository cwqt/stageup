import { HttpErrorResponse } from "@angular/common/http";
import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  ViewChildren,
  AfterViewInit,
  QueryList,
  AfterContentInit,
  OnDestroy,
} from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  NgControl,
  ValidatorFn,
  Validators,
} from "@angular/forms";
import { Y } from "@eventi/interfaces";
import { BehaviorSubject, Observable, Subscription } from "rxjs";
import { takeUntil, takeWhile } from "rxjs/operators";
import { ICacheable } from "src/app/app.interfaces";
import {
  displayValidationErrors,
  handleFormErrors,
} from "src/app/_helpers/formErrorHandler";
import { ButtonComponent } from "../button/button.component";
import { InputComponent } from "../input/input.component";
import {
  CustomUiFieldValidator,
  IUiForm,
  IUiFormField,
  IUiFormFieldValidator,
  IUiFormPrefetchData,
} from "./form.interfaces";

@Component({
  selector: "ui-form",
  templateUrl: "./form.component.html",
  styleUrls: ["./form.component.scss"],
})
export class FormComponent implements OnInit, AfterViewInit {
  @Input() cacheable: ICacheable<any>;
  @Input() form: IUiForm<any>;

  @Output() onSuccess: EventEmitter<any> = new EventEmitter();
  @Output() onFailure: EventEmitter<HttpErrorResponse> = new EventEmitter();

  @ViewChildren(InputComponent) inputs: QueryList<InputComponent>;
  @ViewChildren(ButtonComponent) buttons: QueryList<ButtonComponent>;

  formGroup: FormGroup;
  submissionButton: ButtonComponent;

  shouldBeVisible: boolean = false;

  constructor(private fb: FormBuilder) {}

  async ngOnInit() {
    this.formGroup = Y<any, FormGroup>(
      (r) => (fields: IUiForm<any>["fields"]): FormGroup => {
        return this.fb.group(
          Object.entries(fields).reduce((acc, curr) => {
            const [field_name, field] = curr;
            if (field.type == "container") {
              acc[field_name] = r(field.fields);
            } else {
              acc[field_name] = [
                {
                  value: field.initial ?? "",
                  disabled: field.disabled || false,
                },
                field.validators?.map((v) => {
                  switch (v.type) {
                    case "required":
                      return Validators.required;
                    case "email":
                      return Validators.email;
                    case "minlength":
                      return Validators.minLength(v.value as number);
                    case "maxlength":
                      return Validators.maxLength(v.value as number);
                    case "pattern":
                      return Validators.pattern(v.value as RegExp);
                    case "custom":
                      return this.parseCustomValidator.bind(this)(v);
                  }
                })
              ];
            }

            return acc;
          }, {})
        );
      }
    )(this.form.fields);
  }

  ngAfterViewInit() {
    // Form is hidden by CSS, but active in the DOM - isn't shown until shouldBeVisible == true
    // which is after the prefetch populate has been completed (if any)
    this.submissionButton = this.buttons.find((b) => b.type == "submit");
    if (!this.submissionButton)
      throw new Error('Form has no button of type "submit"');

    // this.inputs.forEach((i) => (i.form = this.formGroup));
    this.formGroup.statusChanges.subscribe((v) => {
      if (v == "VALID") {
        this.cacheable.error = ""; // form errors gone
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
          console.log(this.formGroup)
        });
      } else {
        this.shouldBeVisible = true;
      }
    }, 0);
  }

  populatePrefetch() {
    return this.form.prefetch().then((data:IUiFormPrefetchData) => {
      //https://angular.io/api/forms/AbstractControl#setErrors
      // is nice enough to let us use dot accessors, so no Y combis :( 
      const { fields, errors } = data;

      Object.entries(fields).forEach(([f,v]) => {
        this.formGroup.get(f)?.setValue(v);
      })
      Object.entries(errors).forEach(([f,v]) => {
        const control = this.formGroup.get(f);
        if(control) {
          control.setValidators(this.parseCustomValidator({
            type: "custom",
            value: c => c.value != fields[f],
            message: e => `${v}`,
          }))
          control.updateValueAndValidity();
          control.markAsTouched();
        }

        // console.log('-->',this.formGroup.get(f).setErrors)
        // this.formGroup.get(f)?.setErrors({ backendIssue: v});
        // console.log(this.formGroup.get(f))
        // console.log('-->',this.formGroup.get(f).errors)
      })

      console.log(this.formGroup)

      this.formGroup.markAllAsTouched();
    });
  }

  getValue() {
    const formValue = this.formGroup.value;
    // TODO: implement data transformers in fields
    return formValue;
  }

  onSubmit() {
    this.cacheable.loading = true;
    this.inputs.forEach((i) => i.setDisabledState(true));
    this.submissionButton.loading = true;

    this.form.submit
      .handler(this.getValue())
      .then((v) => this.onSuccess.emit(v))
      .catch((e: HttpErrorResponse) => {
        this.cacheable = handleFormErrors(this.cacheable, e.error);
        displayValidationErrors(this.formGroup, this.cacheable);
        this.onFailure.emit(e);
      })
      .finally(() => {
        this.inputs.forEach((i) => i.setDisabledState(false));
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
            [field.type]: field.message
              ? field.message(control)
              : "Invalid body",
          };
    };
  }
}
