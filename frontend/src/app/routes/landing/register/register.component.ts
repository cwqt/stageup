import { Component, OnInit, ViewChild } from "@angular/core";
import { IUser } from "@eventi/interfaces";
import { ICacheable } from "src/app/app.interfaces";
import { BaseAppService } from "src/app/services/app.service";
import { AuthenticationService } from "src/app/services/authentication.service";
import { MyselfService } from "src/app/services/myself.service";
import { FormComponent } from "src/app/ui-lib/form/form.component";
import { IUiForm } from "src/app/ui-lib/form/form.interfaces";

import { UserService } from "../../../services/user.service";

@Component({
  selector: "app-register",
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.scss"],
})
export class RegisterComponent implements OnInit {
  registerForm: IUiForm<IUser>;
  registerData: ICacheable<string> = {
    data: null,
    error: "",
    loading: false,
    form_errors: {
      username: null,
      email_address: null,
      password: null,
    },
  };

  @ViewChild('form') form:FormComponent;

  constructor(
    private userService: UserService,
    private authService: AuthenticationService,
    private myselfService: MyselfService,
    private appService: BaseAppService
  ) {}

  ngOnInit(): void {
    this.registerForm = {
      fields: [
        {
          type: "text",
          field_name: "username",
          label: "Username",
          validators: [
            { type: "required" },
            { type: "minlength", value: 4 },
            { type: "maxlength", value: 16 },
            {
              type: "pattern",
              value: /^[a-zA-Z0-9]*$/,
              message: (e) => "Must be alphanumeric with no spaces",
            },
          ],
        },
        {
          type: "text",
          field_name: "email_address",
          label: "E-mail address",
          validators: [
            { type: "required" },
            { type: "email" },
            { type: "maxlength", value: 32 },
          ],
        },
        {
          type: "password",
          field_name: "password",
          label: "Password",
          validators: [
            { type: "required" },
            { type: "minlength", value: 8 },
            { type: "maxlength", value: 16 },
          ],
        },
        {
          type: "password",
          field_name: "password_match",
          label: "Repeat password",
          validators: [
            { type: "required" },
            { type: "minlength", value: 8 },
            { type: "maxlength", value: 16 },
            {
              type: "custom",
              message: (e) => "Passwords do not match",
              value: (t, c) => c["password"].value !== t.value,
            },
          ],
        },
      ],
      submit: {
        text: "Register",
        variant: "primary",
        handler: (d) => this.userService.register(d),
      },
    };
  }

  handleRegisterSuccess(user: IUser) {
    const { email_address, password } = this.form.formGroup.value; 
    // get user, host & host info on login
    this.authService.login({ email_address, password }).then(() => {
      this.myselfService.getMyself().then(() => {
        this.appService.navigateTo("/");
      });
    });
  }
}
