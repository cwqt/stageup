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
  FormBuilder,
  FormGroup,
  NgControl,
  Validators,
} from "@angular/forms";
import { ICacheable } from "src/app/app.interfaces";
import {
  displayValidationErrors,
  handleFormErrors,
} from "src/app/_helpers/formErrorHandler";
import { ButtonComponent } from "../button/button.component";
import { InputComponent } from "../input/input.component";

export interface IUiFormField {
  type: "number" | "text" | "password" | "textarea" | "checkbox";
  field_name: string;
  variant?: "primary" | "secondary";
  label?: string;
  default?: string | boolean;
  validators?: IUiFormFieldValidator[];
  hint?:string;

  // internal
  disabled?: boolean;
  errors?: string[];
}

export interface IUiFormFieldValidator {
  type: "required" | "pattern" | "minlength" | "maxlength" | "email";
  value?: number | string | RegExp;
  message?: (e: NgControl) => string;
}
export interface IUiFormSubmit<T> {
  variant: "primary" | "secondary";
  size?: "s" | "m" | "l";
  text: string;
  loadingText?: string;
  handler: () => Promise<T>;
}
export interface IUiForm<T> {
  fields: IUiFormField[];
  submit: IUiFormSubmit<T>;
}

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
  formVisible: boolean = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group(
      this.form.fields.reduce((acc, curr) => {
        acc[curr.field_name] = [
          { value: curr.default ?? "", disabled: curr.disabled || false},
          curr.validators.map((v) => {
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
            }
          }),
        ];

        return acc;
      }, {})
    );
  }

  ngAfterViewInit() {
    this.submissionButton = this.buttons.find((b) => b.type == "submit");
    if (!this.submissionButton)
      throw new Error('Form has no button of type "submit"');

    // this.inputs.forEach((i) => (i.form = this.formGroup));
    this.formGroup.statusChanges.subscribe((v) => {
      if (v == "VALID") {
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
      .handler()
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
}
