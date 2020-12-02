import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { first } from "rxjs/operators";

import { AuthenticationService } from "../../../services/authentication.service";
import { MatDialog } from "@angular/material/dialog";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
  returnUrl: string;
  loginForm: FormGroup;
  loading: boolean = false;
  success: boolean = false;
  errors = {
    email: "",
    password: "",
    form: "",
  };

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthenticationService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required]],
      password: ["", [Validators.required]],
      rememberMe: [false],
    });

    this.returnUrl = this.route.snapshot.queryParams["returnUrl"] || "/";
  }

  get email() {
    return this.loginForm.get("email");
  }
  get password() {
    return this.loginForm.get("password");
  }

  submitHandler() {
    this.loading = true;
    setTimeout(() => {
      this.authService
        .login(this.loginForm.value)
        .pipe(first())
        .subscribe(
          (user) => {
            this.dialog.closeAll();
            this.success = true;
            if (!user.new_user) this.router.navigate(["/"]);
          },
          (err) => {
            this.success = false;
            let errors = err.error.message;
            Object.keys(this.errors).forEach((e) => {
              let i = errors.findIndex((x) => x.param == e);
              if (errors[i]) {
                this.errors[e] = errors[i].msg;
                if (errors[i].param != "form")
                  this.loginForm.controls[e].setErrors({ incorrect: true });
              }
            });
          }
        )
        .add(() => {
          this.loading = false;
        });
    }, 1000);
  }
}
