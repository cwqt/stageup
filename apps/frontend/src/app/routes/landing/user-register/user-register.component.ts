import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { IMyself, IUser } from '@core/interfaces';
import { ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';
import { AuthenticationService } from 'apps/frontend/src/app/services/authentication.service';
import { MyselfService } from 'apps/frontend/src/app/services/myself.service';
import { FormComponent } from 'apps/frontend/src/app/ui-lib/form/form.component';
import { IUiForm } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';

import { UserService } from '../../../services/user.service';
import { IUiDialogOptions, ThemeKind } from '../../../ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-user-register',
  templateUrl: './user-register.component.html',
  styleUrls: ['./user-register.component.scss']
})
export class UserRegisterComponent implements OnInit, IUiDialogOptions {
  @Input() isBusinessRegister: boolean;

  registerForm: IUiForm<IUser>;
  registerData: ICacheable<string> = {
    data: null,
    error: '',
    loading: false,
    form_errors: {
      username: null,
      email_address: null,
      password: null
    }
  };

  @ViewChild('form') form: FormComponent;
  @Output() userTypeChange: EventEmitter<boolean> = new EventEmitter();
  @Output() userRegistered: EventEmitter<IUser> = new EventEmitter();
  @Output() submit = new EventEmitter();
  @Output() cancel = new EventEmitter();
  buttons = [
    {
      text: 'Register',
      kind: ThemeKind.Primary,
      callback: () => this.userService.register(this.form.getValue()).then(u => this.handleRegisterSuccess(u)),
      disabled: true
    }
  ];

  constructor(
    private userService: UserService,
    private authService: AuthenticationService,
    private myselfService: MyselfService,
    private appService: BaseAppService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    console.log(this.isBusinessRegister);

    this.registerForm = {
      fields: {
        username: {
          type: 'text',
          label: 'Username',
          validators: [
            { type: 'required' },
            { type: 'minlength', value: 4 },
            { type: 'maxlength', value: 16 },
            {
              type: 'pattern',
              value: /^[a-zA-Z0-9]*$/,
              message: e => 'Must be alphanumeric with no spaces'
            }
          ]
        },
        email_address: {
          type: 'text',
          label: 'E-mail address',
          validators: [{ type: 'required' }, { type: 'email' }, { type: 'maxlength', value: 32 }]
        },
        password: {
          type: 'password',
          label: 'Password',
          validators: [{ type: 'required' }, { type: 'minlength', value: 8 }, { type: 'maxlength', value: 16 }]
        },
        password_match: {
          type: 'password',
          label: 'Repeat password',
          validators: [
            { type: 'required' },
            { type: 'minlength', value: 8 },
            { type: 'maxlength', value: 16 },
            {
              type: 'custom',
              message: e => 'Passwords do not match',
              value: (t, c) => c['password'].value == t.value
            }
          ]
        }
      },
      submit: {
        is_hidden: true,
        text: 'Register',
        variant: 'primary',
        handler: d => this.userService.register(d)
      }
    };
  }

  onToggleChange(event: MatSlideToggleChange) {
    this.userTypeChange.emit(event.checked);
  }

  handleRegisterSuccess(user: IMyself['user']) {
    const { email_address, password } = this.form.formGroup.value;
    // get user, host & host info on login
    this.authService.login({ email_address, password }).then(() => {
      this.myselfService.getMyself().then(() => {
        // pass up value if in multi-stage business user register
        if (this.isBusinessRegister) {
          this.userRegistered.emit(user);
        } else {
          // otherwise just go to feed page
          this.appService.navigateTo('/');
          this.dialog.closeAll();
        }
      });
    });
  }

  openLogin() {
    this.dialog.closeAll();
    this.appService.navigateTo(`/login`);
  }

  handleFormChange(event: FormGroup) {
    this.buttons[0].disabled = !event.valid;
  }
}
