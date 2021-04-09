import { Component, EventEmitter, Input, OnInit, Output, ViewChild, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { IUser } from '@core/interfaces';
import { ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';
import { FormComponent } from 'apps/frontend/src/app/ui-lib/form/form.component';
import { IUiForm } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';
import { ActivatedRoute } from '@angular/router';
import { ToastService } from '../../../../services/toast.service';
import { UserService } from '../../../../services/user.service';
import { IUiDialogOptions, ThemeKind } from '../../../../ui-lib/ui-lib.interfaces';
import { Subscription } from 'rxjs';

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

  paramsSubscription : Subscription;
  
  resetPasswordForm: IUiForm<void>;
  resetPasswordData: ICacheable<string> = {
    data: null,
    error: '',
    loading: false,
    form_errors: {
      password: null,
      password_match: null,
    }
  };

  buttons: IUiDialogOptions['buttons'] = [
    {
      text: 'Reset Password',
      kind: ThemeKind.Primary,
      callback: () => this.handleChangePassword()
      .then(u => this.handleResetPasswordSuccess(u)),
      disabled: true      
    }
  ];

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
      this.otpReceived = (params['otp']);
    });
    
    this.resetPasswordForm = {
      fields: {
        password: {
          type: 'password',
          label: 'New password',
          validators: [
            { type: 'required' }, 
            { type: 'minlength', value: 8 }, 
            { type: 'maxlength', value: 16 }]
        },
        password_match: {
          type: 'password',
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
        }
      },
      submit: {
        is_hidden: true,
        text: 'Reset Password',
        variant: 'primary',
        handler: d => this.handleChangePassword()
      }
    };
  }

  ngOnDestroy() {
    this.paramsSubscription.unsubscribe();
  }
  
  handleChangePassword(): Promise<void> {
    const password = this.form.formGroup.value;
    const new_password = password.password;    
    return this.userService.resetForgottenPassword( this.otpReceived, new_password );
  }

  handleResetPasswordSuccess(event: any) {   
    this.toastService.emit(`Password changed successfully.`); 
    this.appService.navigateTo('/login');
    this.dialog.closeAll();            
  }

  handleFormChange(event: FormGroup) {
    this.buttons[0].disabled = !event.valid;    
  }
}