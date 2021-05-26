import { Component, EventEmitter, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatHorizontalStepper, MatStepper } from '@angular/material/stepper';
import { IHost, IUser } from '@core/interfaces';
import { IUiDialogOptions } from 'apps/frontend/src/app/ui-lib/ui-lib.interfaces';
import { BaseAppService } from '../../../services/app.service';

@Component({
  selector: 'app-register-dialog',
  templateUrl: './register-dialog.component.html',
  styleUrls: ['./register-dialog.component.scss']
})
export class RegisterDialogComponent implements OnInit, IUiDialogOptions {
  @ViewChild('stepper') stepper: MatHorizontalStepper;
  submit: EventEmitter<any> = new EventEmitter();
  cancel: EventEmitter<any> = new EventEmitter();
  buttons = [];

  userType: 'audience' | 'business' = 'audience';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private ref: MatDialogRef<RegisterDialogComponent>,
    private baseAppService: BaseAppService
  ) {}

  ngOnInit(): void {
    this.userType = this.data.type;
  }

  onUserTypeChanged(event: boolean) {
    this.userType = event ? 'business' : 'audience';
  }

  cachedUser: IUser;
  cachedHost: IHost;
  onUserRegistered(event: IUser) {
    this.cachedUser = event;

    // state propagation push to next tick
    setTimeout(() => {
      this.stepper.next();
    }, 1);
  }

  onHostRegistered(event: IHost) {
    this.cachedHost = event;

    // state propagation push to next tick
    setTimeout(() => {
      this.baseAppService.navigateTo(`/dashboard`);
      this.ref.close();
    }, 1);
  }
}
