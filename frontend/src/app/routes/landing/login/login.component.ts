import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";

import { AuthenticationService } from "../../../services/authentication.service";
import { ICacheable } from 'src/app/app.interfaces';
import { IUser } from '@eventi/interfaces';
import { MyselfService } from 'src/app/services/myself.service';
import { BaseAppService } from 'src/app/services/app.service';
import { HttpErrorResponse } from '@angular/common/http';
import { handleFormErrors } from 'src/app/_helpers/formErrorHandler';


// const formErrorResponseHandler(formErrors:IFormErrorR)


@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
  user:ICacheable<IUser> = {
    data: null,
    error: "",
    loading: false,
    form_errors: {
      email: "",
      password: "",  
    }
  }

  returnUrl: string;
  loginForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private baseAppService:BaseAppService,
    private myselfService: MyselfService,
    private authService: AuthenticationService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email_address: ["", [Validators.required]],
      password: ["", [Validators.required]],
      rememberMe: [false],
    });

    this.returnUrl = this.route.snapshot.queryParams["returnUrl"] || "/";
  }

  get email() { return this.loginForm.get("email_address") }
  get password() { return this.loginForm.get("password") }

  submitHandler() {
    this.user.loading = true;
    this.authService.login(this.loginForm.value)
      .then(u => {
        this.myselfService.setUser(u);
        this.baseAppService.navigateTo('/');
      })
      .catch((e:HttpErrorResponse) => this.user = handleFormErrors(this.user, e.error))
      .finally(() => this.user.loading = false);
  }
}
