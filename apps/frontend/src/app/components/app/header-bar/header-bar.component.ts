import { Component, OnInit, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { IMyself } from '@core/interfaces';
import { AppService } from 'apps/frontend/src/app/services/app.service';
import { AuthenticationService } from 'apps/frontend/src/app/services/authentication.service';
import { HelperService } from '../../../services/helper.service';
import { SearchService } from '../../../services/search.service';

@Component({
  selector: 'app-header-bar',
  templateUrl: './header-bar.component.html',
  styleUrls: ['./header-bar.component.scss']
})
export class HeaderBarComponent implements OnInit {
  @Input() myself: IMyself;

  userPopupOpen: boolean = false;

  constructor(
    private searchService: SearchService,
    private appService: AppService,
    private authService: AuthenticationService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {}

  gotoCatalog() {
    this.appService.navigateTo('/catalog');
  }

  gotoRoot() {
    this.appService.navigateTo('/');
  }

  search(event: string) {
    this.searchService.$searchQuery.next(event);
    this.appService.navigateTo(`/search`, { queryParams: { query: event } });
  }

  toggleUserPopup(state: boolean) {
    this.userPopupOpen = state;
  }

  userLogout() {
    this.authService.logout();
  }

  openLoginDialog() {
    this.appService.navigateTo(`/login`);
  }

  openRegisterDialog() {
    this.appService.navigateTo(`/register`);
  }
}
