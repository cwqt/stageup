import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Environment, IMyself, IUser } from '@core/interfaces';
import { MyselfService } from 'apps/frontend/src/app/services/myself.service';
import { UserService } from 'apps/frontend/src/app/services/user.service';
import { environment } from '../../../environments/environment';
import { BaseAppService } from '../../services/app.service';
import { UserTypeClarificationComponent } from './clarification-page/user-type-clarification/user-type-clarification.component';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  myself: IMyself;
  isLoggedIn: boolean = false;
  isProduction: boolean = environment.environment == Environment.Production;
  isStaging: boolean = environment.environment == Environment.Staging;
  isLive: boolean;

  constructor(
    private myselfService: MyselfService,
    private router: Router,
    private baseAppService: BaseAppService,
    private route: ActivatedRoute,
    public dialog: MatDialog
  ) {}

  async ngOnInit() {
    this.isLive = this.isProduction || this.isStaging;
    this.myselfService.$myself.subscribe(m => (this.myself = m));

    await this.baseAppService.componentInitialising(this.route);

    // May be coming in from an e-mail to accept invite /?invite_accepted=...
    const invite = this.baseAppService.getQueryParam('invite_accepted');
    if(invite) this.baseAppService.navigateTo(`/host`);

    let dialogRef = this.dialog.open(UserTypeClarificationComponent, {
      height: '70%',
      width: '70%',
    });
  }

  scroll(el: HTMLElement) {
    el.scrollIntoView();
  }

  gotoLogin() {
    this.router.navigate(['/login']);
  }
  gotoRegister() {
    this.router.navigate(['/register']);
  }
  gotoMailingList() {}
}
