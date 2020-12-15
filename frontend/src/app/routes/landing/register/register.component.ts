import { HttpErrorResponse } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators
} from "@angular/forms";
import { ICacheable } from "src/app/app.interfaces";
import {
  displayValidationErrors,
  handleFormErrors,
} from "src/app/_helpers/formErrorHandler";

import { UserService } from "../../../services/user.service";

@Component({
  selector: "app-register",
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.scss"],
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  registerButtonText: string = "Register";

  register: ICacheable<string> = {
    data: null,
    error: "",
    loading: false,
    form_errors: {
      username: "",
      email_address: "",
      password: "",
    },
  };

  fieldMinLength: number = 6;
  fieldMaxLength: number = 16;

  constructor(private userService: UserService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group(
      {
        username: [
          "",
          [
            Validators.required,
            Validators.minLength(this.fieldMinLength),
            Validators.maxLength(this.fieldMaxLength),
          ],
        ],
        email_address: ["", [Validators.required, Validators.email]],
        password: [
          "",
          [
            Validators.required,
            Validators.minLength(this.fieldMinLength),
            Validators.maxLength(this.fieldMaxLength),
          ],
        ],
        confirmation: ["", [Validators.required]],
      },
      {
        validator: this.passwordMatchValidator.bind(this),
      }
    );
  }

  get errors() {
    return this.register.form_errors;
  }
  get username() {
    return this.registerForm.get("username");
  }
  get email() {
    return this.registerForm.get("email_address");
  }
  get password() {
    return this.registerForm.get("password");
  }
  get confirmation() {
    return this.registerForm.get("confirmation");
  }

  /* Called on each input in either password field */
  onPasswordInput() {
    if (this.registerForm.hasError("passwordMismatch"))
      this.confirmation.setErrors([{ passwordMismatch: true }]);
    else this.confirmation.setErrors(null);
  }

  private passwordMatchValidator(formGroup: FormGroup) {
    if (!formGroup.get("password").dirty) return;
    if (formGroup.get("password").value !== formGroup.get("confirmation").value)
      return { passwordMismatch: true };
    return null;
  }

  submitHandler() {
    this.register.loading = true;
    this.registerButtonText = "Registering...";
    this.userService
      .register(this.registerForm.value)
      .then((u) => {})
      .catch((e: HttpErrorResponse) => {
        this.register = handleFormErrors(this.register, e.error);
        displayValidationErrors(this.registerForm, this.register);
      })
      .finally(() => (this.register.loading = false));
  }
}
