import { Component, OnInit } from '@angular/core';
import { environment } from '../environments/environment';
import { Title } from '@angular/platform-browser';
import { AuthenticationService } from './services/authentication.service';
import { MyselfService } from './services/myself.service';
import { ToastService } from './services/toast.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { BaseAppService } from './services/app.service';
import { ActivatedRoute } from '@angular/router';
import { UserPermission } from '@core/interfaces';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  loading: boolean = true;

  constructor(
    private myselfService: MyselfService,
    private titleService: Title,
    private authService: AuthenticationService,
    private toastService: ToastService,
    private baseAppService: BaseAppService,
    private route: ActivatedRoute,
    private permissionsService: NgxPermissionsService
  ) {
    console.log(`Running in: ${environment.environment}`);
  }

  async ngOnInit() {
    this.loading = true;
    await this.baseAppService.componentInitialising(this.route);
    this.titleService.setTitle('StageUp - 0.0.4');

    // Upon start up, check if logged in by re-hydrating stored data (if any exists)
    // and then re-fetch the user incase of any changes & set all permissions
    if (this.authService.checkLoggedIn(false)) {
      await this.myselfService.getMyself();
      this.toastService.emit('Welcome back to StageUp! (0.0.4)');

      // May be coming in from an e-mail to accept invite /?invite_accepted=...
      const invite = this.baseAppService.getQueryParam('invite_accepted');
      if (invite) this.baseAppService.navigateTo(`/dashboard`);
    }

    // Subscribe to login state & re-set permissions state on changes
    this.authService.$loggedIn.subscribe(isLoggedIn => {
      let permissions: string[] = [];
      if (isLoggedIn) {
        const myself = this.myselfService.$myself.value;
        // Set permissions for logged in users
        if (myself.user.is_admin) permissions.push(UserPermission.SiteAdmin);
        permissions.push(UserPermission.User);

        if (myself.host_info) permissions.push(myself.host_info.permissions);
      } else {
        permissions = [UserPermission.None];
      }

      this.permissionsService.loadPermissions(permissions);
    });

    setTimeout(() => {
      this.loading = false;
    }, 100);
  }
}
