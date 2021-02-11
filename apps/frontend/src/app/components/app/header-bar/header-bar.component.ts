import { Component, OnInit, Input } from "@angular/core";
import { IMyself } from '@core/interfaces';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';
import { AuthenticationService } from "apps/frontend/src/app/services/authentication.service";
import { PerformanceService } from "../../../services/performance.service";

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

  userLogout() {
    this.authService.logout();
  }

  searchPerformances(searchQuery: string){
    this.appService.navigateTo(`/results`, { queryParams: { search_query: searchQuery  }});
  }
}
