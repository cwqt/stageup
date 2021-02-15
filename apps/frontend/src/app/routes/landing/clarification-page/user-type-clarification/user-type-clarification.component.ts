import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';

export enum UserType {
  Client = "client",
  Host = "host"
}

@Component({
  selector: 'app-user-type-clarification',
  templateUrl: './user-type-clarification.component.html',
  styleUrls: ['./user-type-clarification.component.css']
})
export class UserTypeClarificationComponent implements OnInit {

  constructor(private baseAppService: BaseAppService, 
    private router:Router, 
    public dialogRef: MatDialogRef<UserTypeClarificationComponent>) { }

  ngOnInit(): void {
    if(localStorage.getItem("clientOrHost") === UserType.Client){
      this.baseAppService.navigateTo('/client');
      this.dialogRef.close();
    } else if(localStorage.getItem("clientOrHost") === UserType.Host) this.baseAppService.navigateTo('/host');    
  }

  storeClarificationChoice(choice: UserType){
    localStorage.setItem("clientOrHost", choice);
  }

  goToHostLanding(){
    this.baseAppService.navigateTo('/host');
    this.storeClarificationChoice(UserType.Host);
  }

  gotoClientLanding(){
    this.baseAppService.navigateTo('/client');
    this.storeClarificationChoice(UserType.Client);
    this.dialogRef.close();
  }
}
