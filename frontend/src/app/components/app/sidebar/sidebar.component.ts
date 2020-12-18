import { Component, Input, OnInit } from '@angular/core';
import { IMyself, IUser } from '@eventi/interfaces';
import { BaseAppService } from 'src/app/services/app.service';
import { AuthenticationService } from 'src/app/services/authentication.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Input() myself:IMyself;

  userPopupOpen:boolean = false;

  constructor(private appService:BaseAppService, private authService:AuthenticationService) { }

  get user() { return this.myself.user }
  get host() { return this.myself.host }

  ngOnInit(): void {
  }

  gotoRoot() { this.appService.navigateTo('/') }
  gotoSettings() { this.appService.navigateTo('settings') }
  gotoHost() { this.appService.navigateTo('host') }
  gotoAdminPanel() { this.appService.navigateTo('admin') }

  toggleUserPopup(state:boolean) {
    this.userPopupOpen = state;
  }

  logout() {
    this.authService.logout();
  }
}
