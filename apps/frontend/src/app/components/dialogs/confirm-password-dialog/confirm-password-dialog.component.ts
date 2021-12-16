import { EventEmitter, Component, OnInit, Output } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { IPasswordConfirmationResponse } from '@core/interfaces';
import { Cacheable } from '@frontend/app.interfaces';
import { MyselfService } from '@frontend/services/myself.service';
import { UiDialogButton } from '@frontend/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { UiField, UiForm } from '@frontend/ui-lib/form/form.interfaces';
import { IUiDialogOptions, SecondaryButton, ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-confirm-password-dialog',
  templateUrl: './confirm-password-dialog.component.html',
  styleUrls: ['./confirm-password-dialog.component.scss']
})
export class ConfirmPasswordDialogComponent implements OnInit, IUiDialogOptions {
  response = new Cacheable<IPasswordConfirmationResponse>();
  passwordForm: UiForm<IPasswordConfirmationResponse>;

  @Output() submit: EventEmitter<IPasswordConfirmationResponse> = new EventEmitter();
  @Output() cancel: EventEmitter<void> = new EventEmitter();
  buttons;

  constructor(private myselfService: MyselfService) {}

  ngOnInit(): void {
    this.passwordForm = new UiForm({
      fields: {
        password: UiField.Password({
          label: $localize`Password`,
          placeholder: $localize`Enter your password...`,
          validators: [{ type: 'required' }]
        })
      },
      resolvers: {
        output: async v => await this.myselfService.confirmPassword(v.password)
      }
    });

    this.buttons = [
      new UiDialogButton({
        kind: SecondaryButton,
        label: $localize`Cancel`,
        callback: () => this.cancel.emit()
      }),
      new UiDialogButton({
        kind: ThemeKind.Primary,
        label: $localize`Confirm Password`,
        callback: async () => {
          const res = await this.passwordForm.submit();
          if (res.is_valid == false) {
            this.passwordForm.group.controls.password.setErrors({ custom: $localize`Invalid password` });
          } else {
            this.submit.emit(res);
          }
        }
      })
    ];
  }
}
