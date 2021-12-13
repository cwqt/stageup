import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { DtoSocialLogin, IUser } from '@core/interfaces';
import { ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { AuthenticationService } from 'apps/frontend/src/app/services/authentication.service';
import { MyselfService } from 'apps/frontend/src/app/services/myself.service';
import { AppService } from 'apps/frontend/src/app/services/app.service';
import { UiField, UiForm } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';
import { MatDialog } from '@angular/material/dialog';
import { IUiDialogOptions } from '../../../ui-lib/ui-lib.interfaces';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { UiDialogButton } from '../../../ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { SocialAuthService, GoogleLoginProvider, FacebookLoginProvider, SocialUser } from 'angularx-social-login';

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
    private appService: AppService,
    private myselfService: MyselfService,
    private authService: AuthenticationService,
    private dialog: MatDialog,
    private socialAuthService: SocialAuthService
  ) {}

  ngOnInit(): void {
    this.loginForm = new UiForm({
      fields: {
        email_address: UiField.Text({
          label: $localize`E-mail address`,
          validators: [{ type: 'required' }, { type: 'email' }, { type: 'maxlength', value: 256 }]
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
          this.handlePostSignIn();
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
    this.appService.navigateTo(`/register`);
  }

  openPasswordResetDialog() {
    this.dialog.open(ForgotPasswordComponent, { disableClose: true });
  }

  loginWithGoogle(): void {
    this.socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID).then(async data => {
      // Add details to our DB (if not already) and grant access
      await this.authService.socialSignIn(this.toDtoSocialLogin(data));
      this.handlePostSignIn();
    });
  }

  loginWithFacebook(): void {
    this.socialAuthService.signIn(FacebookLoginProvider.PROVIDER_ID).then(async data => {
      await this.authService.socialSignIn(this.toDtoSocialLogin(data));
      this.handlePostSignIn();
    });
  }

  // Filter out the data we need from the SocialUser object
  toDtoSocialLogin(data: SocialUser): DtoSocialLogin {
    return {
      email: data.email,
      provider: data.provider,
      name: data.name,
      firstName: data.firstName,
      lastName: data.lastName,
      photoUrl: data.photoUrl,
      id: data.id
    };
  }

  handlePostSignIn(): void {
    this.myselfService.getMyself().then(myself => {
      // If the user has set a preferred language, we want to prefix the URL with that when they login
      this.appService.navigateTo(myself.host_info?.prefers_dashboard_landing ? `/dashboard` : `/`);
      this.dialog.closeAll();
    });
  }
}
