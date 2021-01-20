import { Component, OnInit, Input } from "@angular/core";
import { IMyself } from '@eventi/interfaces';
import { BaseAppService } from 'src/app/services/app.service';
import { AuthenticationService } from "src/app/services/authentication.service";

@Component({
  selector: "app-header-bar",
  templateUrl: "./header-bar.component.html",
  styleUrls: ["./header-bar.component.scss"],
})
export class HeaderBarComponent implements OnInit {
  @Input() myself: IMyself;

  userPopupOpen:boolean = false;

  constructor(
    private appService:BaseAppService,
    private authService:AuthenticationService
  ) {}

  ngOnInit(): void {
  }

  gotoCatalog() {
    this.appService.navigateTo("/catalog");
  }

  gotoRoot() {
    this.appService.navigateTo("/");
  }

  toggleUserPopup(state:boolean) {
    this.userPopupOpen = state;
  }

  gotoSettings() { this.appService.navigateTo('settings') }
  logout() {
    this.authService.logout();
  }
}
