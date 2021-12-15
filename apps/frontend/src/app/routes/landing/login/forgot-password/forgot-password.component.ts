import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { IUser } from '@core/interfaces';
import { UiDialogButton } from 'apps/frontend/src/app/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { UiField, UiForm } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';
import { ToastService } from '../../../../services/toast.service';
import { UserService } from '../../../../services/user.service';
import { IUiDialogOptions, ThemeKind } from '../../../../ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit, IUiDialogOptions {
  @Output() submit = new EventEmitter();
  @Output() cancel = new EventEmitter();

  dialogMessage: string;
  sendEmailForm: UiForm;
  buttons: IUiDialogOptions['buttons'];

  constructor(
    private userService: UserService,
    public dialogRef: MatDialogRef<IUser>,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.dialogMessage = '';

    this.sendEmailForm = new UiForm({
      fields: {
        email: UiField.Text({
          label: 'email',
          validators: [{ type: 'required' }, { type: 'email' }]
        })
      },
      resolvers: {
        output: async v => {
          this.dialogMessage = $localize`Password reset link sent successfully.`;
          this.buttons[0].label = $localize`Send Again`;
          this.toastService.emit($localize`Please check your email.`);
          return this.userService.forgotPassword(v.email);
        }
      }
    });

    this.buttons = [
      new UiDialogButton({
        label: $localize`Reset Password`,
        kind: ThemeKind.Primary,
        callback: () => this.sendEmailForm.submit(),
        disabled: true
      }).attach(this.sendEmailForm)
    ];
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
