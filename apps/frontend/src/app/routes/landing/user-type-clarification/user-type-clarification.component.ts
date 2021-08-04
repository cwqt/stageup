import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AppService } from 'apps/frontend/src/app/services/app.service';

export enum UserType {
  Client = 'client',
  Host = 'host'
}

@Component({
  selector: 'app-user-type-clarification',
  templateUrl: './user-type-clarification.component.html',
  styleUrls: ['./user-type-clarification.component.scss']
})
export class UserTypeClarificationComponent implements OnInit {
  constructor(private appService: AppService, public dialogRef: MatDialogRef<UserTypeClarificationComponent>) {}

  ngOnInit(): void {}

  goToHostLanding() {
    this.appService.navigateTo('/host');
    this.dialogRef.close();
  }

  gotoClientLanding() {
    this.dialogRef.close();
  }
}
