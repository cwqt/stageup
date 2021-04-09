import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { Environment, IUser, IHost } from '@core/interfaces';
import { Auth, ErrorHandler, handleError } from '@core/shared/api';
import { ICacheable, createICacheable } from 'apps/frontend/src/app/app.interfaces';
import { AuthenticationService } from 'apps/frontend/src/app/services/authentication.service';
import { MyselfService } from 'apps/frontend/src/app/services/myself.service';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';
import { IUiForm } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';
import { environment as env } from 'apps/frontend/src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { IUiDialogOptions, ThemeKind } from '../../../ui-lib/ui-lib.interfaces';
import { FormGroup } from '@angular/forms';
import { FormComponent } from '../../../ui-lib/form/form.component';
import { HelperService } from "../../../services/helper.service";
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, IUiDialogOptions {
  @ViewChild('form') form: FormComponent;

  loginForm: IUiForm<IUser>;
  user: ICacheable<IUser> = {
    data: null,
    error: '',
    loading: false,
    form_errors: {
      email_address: null,
      password: null
    }
  };

  @Output() submit = new EventEmitter();
  @Output() cancel = new EventEmitter();

  buttons = [
    {
      text: 'Login',
      kind: ThemeKind.Primary,
      callback: () => this.authService.login(this.form.getValue()).then(u => this.onLoginSuccess(u)),
      disabled: true
    }
  ];

  constructor(
    private baseAppService: BaseAppService,
    private myselfService: MyselfService,
    private authService: AuthenticationService,
    private dialog: MatDialog,

  ) {}

  ngOnInit(): void {
    this.loginForm = {
      fields: {
        email_address: {
          type: 'text',
          label: 'E-mail address',
          validators: [{ type: 'required' }, { type: 'email' }]
        },
        password: {
          type: 'password',
          label: 'Password',
          validators: [{ type: 'required' }]
        }
      },
      submit: {
        is_hidden: true,
        text: 'Sign in',
        variant: 'primary',
        handler: async d => this.authService.login(d)
      }
    };
  }

  async adminFastLogin() {
    const user = await this.authService.login({
      email_address: 'siteadmin@cass.si',
      password: 'siteadmin'
    });

    this.onLoginSuccess(user);
  }

  onLoginSuccess(user: IUser) {
    // get user, host & host info on login & re-direct according to set preferred landing page
    this.myselfService.getMyself().then(myself => {
      this.baseAppService.navigateTo(myself.host_info?.prefers_dashboard_landing 
                                     ? '/dashboard'
                                     : '/');
      this.dialog.closeAll();
    });
  }

  openRegister() {
    this.dialog.closeAll();
    this.baseAppService.navigateTo(`/register`);
  }

  handleFormChange(event: FormGroup) {
    this.buttons[0].disabled = !event.valid;
  }

  openPasswordResetDialog() {
     this.dialog.open(ForgotPasswordComponent, { disableClose: true })
  }
}