import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { IUser } from '@core/interfaces';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';
import { AuthenticationService } from 'apps/frontend/src/app/services/authentication.service';
import { MyselfService } from 'apps/frontend/src/app/services/myself.service';
import { UiField, UiForm } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';
import { UserService } from '../../../services/user.service';
import { UiDialogButton } from '../../../ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { IUiDialogOptions } from '../../../ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-user-register',
  templateUrl: './user-register.component.html',
  styleUrls: ['./user-register.component.scss']
})
export class UserRegisterComponent implements OnInit, IUiDialogOptions, OnDestroy {
  @Input() isBusinessRegister: boolean;

  @Output() userTypeChange: EventEmitter<boolean> = new EventEmitter();
  @Output() userRegistered: EventEmitter<IUser> = new EventEmitter();
  @Output() submit = new EventEmitter();
  @Output() cancel = new EventEmitter();

  registerForm: UiForm<IUser>;
  buttons: UiDialogButton[];

  constructor(
    private userService: UserService,
    private authService: AuthenticationService,
    private myselfService: MyselfService,
    private appService: BaseAppService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.registerForm = new UiForm({
      fields: {
        username: UiField.Text({
          label: $localize`Username`,
          validators: [
            { type: 'required' },
            { type: 'minlength', value: 4 },
            { type: 'maxlength', value: 16 },
            {
              type: 'pattern',
              value: /^[a-zA-Z0-9]*$/,
              message: () => $localize`Must be alphanumeric with no spaces`
            }
          ]
        }),
        email_address: UiField.Text({
          label: $localize`E-mail address`,
          validators: [{ type: 'required' }, { type: 'email' }, { type: 'maxlength', value: 32 }]
        }),
        password: UiField.Password({
          label: $localize`Password`,
          validators: [{ type: 'required' }, { type: 'minlength', value: 8 }, { type: 'maxlength', value: 16 }]
        }),
        password_match: UiField.Password({
          label: $localize`Repeat password`,
          validators: [
            { type: 'required' },
            { type: 'minlength', value: 8 },
            { type: 'maxlength', value: 16 },
            {
              type: 'custom',
              message: () => $localize`Passwords do not match`,
              value: (self, fg) => (console.log(fg, self), fg.value['password'] == self.value)
            }
          ]
        })
      },
      resolvers: {
        output: async v =>
          this.userService.register({
            username: v.username,
            password: v.password,
            email_address: v.email_address
          })
      },
      handlers: {
        success: async (user, form) => {
          const { email_address, password } = form.value;

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
      }
    });

    this.buttons = [
      new UiDialogButton({
        label: $localize`Register`,
        callback: () => this.registerForm.submit()
      }).attach(this.registerForm)
    ];
  }

  onToggleChange(event: MatSlideToggleChange) {
    this.userTypeChange.emit(event.checked);
  }

  openLogin() {
    this.dialog.closeAll();
    this.appService.navigateTo(`/login`);
  }

  ngOnDestroy() {
    this.registerForm.destroy();
  }
}
