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
import { IMyself, IUser } from "@eventi/interfaces";
import { MyselfService } from "src/app/services/myself.service";
import { BaseAppService } from "src/app/services/app.service";
import { HttpErrorResponse } from "@angular/common/http";
import {
  handleFormErrors,
  displayValidationErrors,
} from "src/app/_helpers/formErrorHandler";
import { IUiForm } from "src/app/ui-lib/form/form.interfaces";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
  loginForm: IUiForm<IUser>;
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
    if (this.myselfService.$myself.value) this.baseAppService.navigateTo("/");

    this.loginForm = {
      fields: [
        {
          type: "text",
          field_name: "email_address",
          label: "E-mail address",
          validators: [{ type: "required" }, { type: "email" }],
        },
        {
          type: "password",
          field_name: "password",
          label: "Password",
          validators: [{ type: "required" }],
        },
      ],
      submit: {
        text: "Sign in",
        variant: "primary",
        handler: async (d) => this.authService.login(d),
      },
    };
  }

  async TEST_LOGIN() {
    let user = await this.authService.login({
      email_address: "m@cass.si",
      password: "helloworld"
    });
    this.onLoginSuccess(user);
  }

  onLoginSuccess(user: IUser) {
    // get user, host & host info on login
    this.myselfService.getMyself().then(() => {
      this.baseAppService.navigateTo("/");
    });
  }
}
