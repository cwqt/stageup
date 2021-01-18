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
} from "./form.interfaces";

@Component({
  selector: "ui-form",
  templateUrl: "./form.component.html",
  styleUrls: ["./form.component.scss"],
})
export class FormComponent implements OnInit, OnDestroy {
  @Input() cacheable: ICacheable<any>;
  @Input() form: IUiForm<any>;

  @Output() onSuccess: EventEmitter<any> = new EventEmitter();
  @Output() onFailure: EventEmitter<HttpErrorResponse> = new EventEmitter();

  @ViewChildren(InputComponent) inputs: QueryList<InputComponent>;
  @ViewChildren(ButtonComponent) buttons: QueryList<ButtonComponent>;

  formGroup: FormGroup;
  submissionButton: ButtonComponent;
  $prefetchState: BehaviorSubject<boolean> = new BehaviorSubject(false);
  $prefetchSubscription: Subscription;

  constructor(private fb: FormBuilder) {}

  async ngOnInit() {
    if (this.form.prefetch) {
      await this.populatePrefetch(this.form.prefetch);
    } else {
      this.$prefetchState.next(true);
    }

    this.$prefetchSubscription = this.$prefetchState
    .subscribe((v) => {
      setTimeout(() => {
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
        }, 0);
        return true;
      }, 100)

    });

    setTimeout(() => {
      this.$prefetchState.next(!this.$prefetchState.value)
    }, 1000)

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
                }),
              ];
            }

            return acc;
          }, {})
        );
      }
    )(this.form.fields);
  }

  populatePrefetch(prefetchFn: IUiForm<any>["prefetch"]) {
    return prefetchFn()
      .then((data) => {
        // Save the value into the IUiForm by setting each fields 'initial' to the sent value
        // for e.g. when in the host onboarding switching back & forth we want to maintain state
        Y((r) => (x: [IUiForm<any>["fields"], any]) => {
          let [fields, data] = x;
          Object.entries(fields).forEach(([fieldName, field]) => {
            if (data[fieldName]) {
              if (field.type == "container") {
                r([field.fields, data[fieldName]]);
              } else {
                field.initial = data[fieldName] || "";
              }
            }
          });
        })([this.form.fields, data]);
      })
      // .finally(() => this.$prefetchState.next(true));
  }

  getValue() {
    const formValue = this.formGroup.value;

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

  ngOnDestroy() {
    this.$prefetchSubscription.unsubscribe();
  }
}
