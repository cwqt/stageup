import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { Environment, IUser } from '@core/interfaces';

import { ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { AuthenticationService } from 'apps/frontend/src/app/services/authentication.service';
import { MyselfService } from 'apps/frontend/src/app/services/myself.service';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';
import { IUiForm } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';
import { environment as env } from 'apps/frontend/src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { IUiDialogOptions, ThemeKind } from '../../../ui-lib/ui-lib.interfaces';
import { FormGroup } from '@angular/forms';
import { FormComponent } from '../../../ui-lib/form/form.component';

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
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Can't login if already logged in
    if (this.myselfService.$myself.value) this.baseAppService.navigateTo('/');

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
    // get user, host & host info on login
    this.myselfService.getMyself().then(() => {
      this.baseAppService.navigateTo('/');
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
}
