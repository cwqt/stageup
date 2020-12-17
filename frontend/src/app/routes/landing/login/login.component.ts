import { Component, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";

import { AuthenticationService } from "../../../services/authentication.service";
import { ICacheable } from "src/app/app.interfaces";
import { IUser } from "@eventi/interfaces";
import { MyselfService } from "src/app/services/myself.service";
import { BaseAppService } from "src/app/services/app.service";
import { HttpErrorResponse } from "@angular/common/http";
import {
  handleFormErrors,
  displayValidationErrors,
} from "src/app/_helpers/formErrorHandler";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  user: ICacheable<IUser> = {
    data: null,
    error: "",
    loading: false,
    form_errors: {
      email_address: "",
      password: "",
    },
  };

  constructor(
    private baseAppService: BaseAppService,
    private myselfService: MyselfService,
    private authService: AuthenticationService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    // Can't login if already logged in
    if(this.myselfService.$myself.value) this.baseAppService.navigateTo('/');

    this.loginForm = this.fb.group({
      email_address: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
      // rememberMe: [false],
    });
  }

  get email() { return this.loginForm.get("email_address") }
  get password() { return this.loginForm.get("password") }

  submitHandler() {
    this.user.loading = true;
    this.authService
      .login(this.loginForm.value)
      .then(u => {
        // get user, host & host info on login
        this.myselfService.getMyself().then(() => {
          this.baseAppService.navigateTo("/");
        })
      })
      .catch((e: HttpErrorResponse) => {
        this.user = handleFormErrors(this.user, e.error);
        displayValidationErrors(this.loginForm, this.user);
      })
      .finally(() => (this.user.loading = false));
  }
}
