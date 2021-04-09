import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
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

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})

export class ForgotPasswordComponent implements OnInit, IUiDialogOptions {
  @ViewChild('form') form: FormComponent;
  @Output() submit = new EventEmitter();
  @Output() cancel = new EventEmitter();

  dialogMessage: string;
  
  sendEmailForm: IUiForm<void>;
  sendEmailData: ICacheable<string> = {
    data: null,
    error: '',
    loading: false,
    form_errors: {
      email_address: null
    }
  };

  buttons: IUiDialogOptions['buttons'] = [
    {
      text: 'Reset Password',
      kind: ThemeKind.Primary,
      callback: () => this.handleSendInstructions(),
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
    this.dialogMessage = '';
       
    this.sendEmailForm = {
      fields: {
        email: {
          type: 'text',
          label: 'email',
          validators: [
            { type: 'required' }, 
            { type: 'maxlength', value: 32 }]
        },        
      },
      submit: {
        is_hidden: true,
        text: 'Reset Password',
        variant: 'primary',
        handler: d => this.handleSendInstructions()
      }
    };
  }
  
  handleSendInstructions(): Promise<void> {    
    this.dialogMessage = 'Password reset link sent successfully.';
    this.buttons[0].text = 'Send Again';
    const email_address = this.form.formGroup.value;
    this.toastService.emit(`Please check your email.`);
    return this.userService.forgotPassword(email_address.email);  
  }

  handleFormChange(event: FormGroup) {
    this.buttons[0].disabled = !event.valid;    
  }

  closeDialog() {
    this.dialogRef.close();
  }
}