import { Component, Input, OnInit } from '@angular/core';
import { IUser } from '@eventi/interfaces';
import { UserService } from 'apps/frontend/src/app/services/user.service';

@Component({
  selector: 'app-profile-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.scss']
})
export class ProfileSettingsComponent implements OnInit {
  @Input() user:IUser & { email_address: string };

  constructor(private userService:UserService) { }

  ngOnInit(): void {
    this.user = this.userService.currentUserValue as any;
  }

}
