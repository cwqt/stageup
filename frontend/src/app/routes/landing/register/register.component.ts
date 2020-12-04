import { Component, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
  FormGroupDirective,
  NgForm,
} from "@angular/forms";
import { ErrorStateMatcher } from "@angular/material/core";

import { UserService } from "../../../services/user.service";

class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const isSubmitted = form && form.submitted;
    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched || isSubmitted)
    );
  }
}

@Component({
  selector: "app-register",
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.scss"],
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading: boolean = false;
  success: boolean = false;
  registerButtonText: string = "Register";
  errors = {
    username: "",
    email: "",
    password: "",
    form: ""
  };

  pw_min_len: number = 6;
  field_max_len: number = 16;

  constructor(private userService: UserService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group(
      {
        username: [
          "",
          { validators: [this.usernameValidator], updateOn: "change" },
        ],
        email: ["", [Validators.required]],
        password: [
          "",
          [
            Validators.required,
            Validators.minLength(this.pw_min_len),
            Validators.maxLength(this.field_max_len),
          ],
        ],
        confirmation: ["", [Validators.required]],
      },
      {
        validator: this.passwordMatchValidator.bind(this),
        matcher: new MyErrorStateMatcher(),
      }
    );
  }

  get username() {
    return this.registerForm.get("username");
  }
  get email() {
    return this.registerForm.get("email");
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

  private usernameValidator(control): { [key: string]: boolean } | null {
    let username_regex = new RegExp(/^[a-zA-Z0-9]+$/);
    if (control.value !== null && username_regex.test(control.value) == false) {
      return { usernameForbidden: true };
    }
    return null;
  }

  submitHandler() {
    this.loading = true;
    this.registerButtonText = "Registering...";
    this.userService
      .register(this.registerForm.value)
      .subscribe(
        (res) => {
          this.success = true;
        },
        (err) => {
          this.errors.form = err.message;
          this.success = false;
          this.registerButtonText = "Try again?";
          let errors = err.error.message;
          Object.keys(this.errors).forEach((e) => {
            let i = errors.findIndex((x) => x.param == e);
            if (errors[i]) {
              this.errors[e] = errors[i].msg;
              this.registerForm.controls[e].setErrors({ incorrect: true });
            }
          });
        }
      )
      .add(() => {
        this.loading = false;
      });
  }
}
