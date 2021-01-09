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
import { IFormErrorField } from "@eventi/interfaces";
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
} from "./form.interfaces";

@Component({
  selector: "ui-form",
  templateUrl: "./form.component.html",
  styleUrls: ["./form.component.scss"],
})
export class FormComponent implements OnInit, AfterViewInit, AfterContentInit {
  @Input() cacheable: ICacheable<any>;
  @Input() form: IUiForm<any>;

  @Output() onSuccess: EventEmitter<any> = new EventEmitter();
  @Output() onFailure: EventEmitter<HttpErrorResponse> = new EventEmitter();

  @ViewChildren(InputComponent) inputs: QueryList<InputComponent>;
  @ViewChildren(ButtonComponent) buttons: QueryList<ButtonComponent>;

  formGroup: FormGroup;
  submissionButton: ButtonComponent;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    const createFormGroup = (fields: IUiFormField[], parentForm?:FormComponent): FormGroup => {
      return this.fb.group(
        fields.reduce((acc, curr) => {
          if (curr.type == "container") {
            acc[curr.field_name] = createFormGroup(curr.fields);
          } else {
            acc[curr.field_name] = [
              { value: curr.default ?? "", disabled: curr.disabled || false },
              curr.validators?.map((v) => {
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
              }),
            ];
          }

          return acc;
        }, {})
      );
    };

    this.formGroup = createFormGroup(this.form.fields, null);
    console.log(this.formGroup)
  }

  ngAfterViewInit() {
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
  }

  ngAfterContentInit() {
    setTimeout(() => {
      this.submissionButton.disabled = true;
    }, 0);
  }

  onSubmit() {
    this.cacheable.loading = true;
    this.inputs.forEach((i) => i.setDisabledState(true));
    this.submissionButton.loading = true;
    this.form.submit
      .handler(this.formGroup.value)
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

      const valid = (field.value as CustomUiFieldValidator)(
        control,
        control.parent.controls as { [index: string]: AbstractControl }
      );

      return valid
        ? { [field.type]: field.message(control) || "Invalid message" }
        : null;
    };
  }
}
