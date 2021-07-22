import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { Environment, IUser, IHost } from '@core/interfaces';
import { Auth, ErrorHandler, handleError } from '@core/api';
import { ICacheable, createICacheable } from 'apps/frontend/src/app/app.interfaces';
import { AuthenticationService } from 'apps/frontend/src/app/services/authentication.service';
import { MyselfService } from 'apps/frontend/src/app/services/myself.service';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';
import { IUiForm, UiField, UiForm } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';
import { environment as env } from 'apps/frontend/src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { IUiDialogOptions, ThemeKind } from '../../../ui-lib/ui-lib.interfaces';
import { FormGroup } from '@angular/forms';
import { FormComponent } from '../../../ui-lib/form/form.component';
import { HelperService } from '../../../services/helper.service';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { UiDialogButton } from '../../../ui-lib/dialog/dialog-buttons/dialog-buttons.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, IUiDialogOptions {
  loginForm: UiForm<IUser>;
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

  buttons: UiDialogButton[];

  constructor(
    private baseAppService: BaseAppService,
    private myselfService: MyselfService,
    private authService: AuthenticationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loginForm = new UiForm({
      fields: {
        email_address: UiField.Text({
          label: $localize`E-mail address`,
          validators: [{ type: 'required' }, { type: 'email' }]
        }),
        password: UiField.Password({
          label: $localize`Password`,
          validators: [{ type: 'required' }]
        })
      },
      resolvers: {
        output: async v =>
          this.authService.login({
            email_address: v.email_address,
            password: v.password
          })
      },
      handlers: {
        success: async () => {
          // get user, host & host info on login & re-direct according to set preferred landing page
          this.myselfService.getMyself().then(myself => {
            // If the user has set a preferred language, we want to prefix the URL with that when they login
            const localeRedirect = myself.user.locale ? `/${myself.user.locale.language}` : '';
            this.baseAppService.navigateTo(myself.host_info?.prefers_dashboard_landing ? `${localeRedirect}/dashboard` : `${localeRedirect}/`);
            this.dialog.closeAll();
          });
        }
      }
    });

    this.buttons = [
      new UiDialogButton({
        label: $localize`Login`,
        callback: () => this.loginForm.submit()
      }).attach(this.loginForm)
    ];
  }

  openRegister() {
    this.dialog.closeAll();
    this.baseAppService.navigateTo(`/register`);
  }

  openPasswordResetDialog() {
    this.dialog.open(ForgotPasswordComponent, { disableClose: true });
  }
}
