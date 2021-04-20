import { Component, EventEmitter, Input, OnInit, Output, ViewChild, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { IUser } from '@core/interfaces';
import { ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';
import { FormComponent } from 'apps/frontend/src/app/ui-lib/form/form.component';
import { IUiForm, UiField, UiForm } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';
import { ActivatedRoute } from '@angular/router';
import { ToastService } from '../../../../services/toast.service';
import { UserService } from '../../../../services/user.service';
import { IUiDialogOptions, ThemeKind } from '../../../../ui-lib/ui-lib.interfaces';
import { Subscription } from 'rxjs';
import { UiDialogButton } from 'apps/frontend/src/app/ui-lib/dialog/dialog-buttons/dialog-buttons.component';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit, IUiDialogOptions {
  @Input() otpReceived: string;
  @ViewChild('form') form: FormComponent;
  @Output() submit = new EventEmitter();
  @Output() cancel = new EventEmitter();

  resetPasswordForm: UiForm<void>;
  paramsSubscription: Subscription;
  buttons: IUiDialogOptions['buttons'];

  constructor(
    private userService: UserService,
    private appService: BaseAppService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<IUser>,
    private toastService: ToastService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Extracts otp param from url
    this.paramsSubscription = this.route.queryParams.subscribe(params => {
      this.otpReceived = params['otp'];
    });

    this.resetPasswordForm = new UiForm({
      fields: {
        password: UiField.Password({
          label: 'New password',
          validators: [{ type: 'required' }, { type: 'minlength', value: 8 }, { type: 'maxlength', value: 16 }]
        }),
        password_match: UiField.Password({
          label: 'Confirm new password',
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
        })
      },
      resolvers: {
        output: async d => this.userService.resetForgottenPassword(this.otpReceived, d.password)
      },
      handlers: {
        success: async () => {
          this.toastService.emit(`Password changed successfully.`);
          this.appService.navigateTo('/login');
          this.dialog.closeAll();
        }
      }
    });

    this.buttons = [
      new UiDialogButton({
        label: 'Reset Password',
        kind: ThemeKind.Primary,
        callback: () => this.resetPasswordForm.submit()
      }).attach(this.resetPasswordForm)
    ];
  }

  ngOnDestroy() {
    this.paramsSubscription.unsubscribe();
    this.resetPasswordForm.destroy();
  }
}
