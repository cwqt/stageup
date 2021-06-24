import { Component, OnInit } from '@angular/core';
import { environment } from '../environments/environment';
import { Title } from '@angular/platform-browser';
import { AuthenticationService } from './services/authentication.service';
import { MyselfService } from './services/myself.service';
import { ToastService } from './services/toast.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { BaseAppService } from './services/app.service';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { Environment, UserPermission } from '@core/interfaces';
import { NGXLogger } from 'ngx-logger';
import { HttpErrorResponse } from '@angular/common/http';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  loading: boolean = true;
  showCurtain: boolean = false; // show the bouncing icon for a bit longer while the page content is loading
  loadError: string;
  localeRedirect: string;

  constructor(
    private myselfService: MyselfService,
    private titleService: Title,
    private authService: AuthenticationService,
    private toastService: ToastService,
    private baseAppService: BaseAppService,
    private route: ActivatedRoute,
    private permissionsService: NgxPermissionsService,
    private logger: NGXLogger,
    private router: Router
  ) {}

  async ngOnInit() {
    // Not using nginx in prod which serves many locales, so any links we get in e-mails will result in 404s because
    // of the locale /en/, /no/, /cy/ not existing on serve server - so re-write them out if the url starts with the current locale
    if (environment.environment == Environment.Development) {
      this.router.events.pipe(filter(event => event instanceof NavigationStart)).subscribe((event: NavigationStart) => {
        // TODO: Additional check to see if the url starts with the users preferred language choice (in their profile settings)
        if (event.url.startsWith(`/${environment.locale}/`))
          this.router.navigateByUrl(event.url.replace(`/${environment.locale}/`, '/'));
      });
    }

    this.logger.debug(`Running in: ${environment.environment}`);

    this.loading = true;
    this.showCurtain = true;
    await this.baseAppService.componentInitialising(this.route);
    this.titleService.setTitle(`StageUp - ${environment.appVersion}`);

    // Upon start up, check if logged in by re-hydrating stored data (if any exists)
    // and then re-fetch the user incase of any changes & set all permissions
    try {
      if (this.authService.checkLoggedIn(false)) {
        await this.myselfService.getMyself();
        this.toastService.emit(`Welcome back to StageUp! (${environment.appVersion})`);

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
          // If user is logged in, we will redirect to their preferred language choice when they navigate to the site.
          if (myself.user.locale) this.localeRedirect = `${myself.user.locale.language}/${this.baseAppService.getUrl()}`; 
        } else {
          permissions = [UserPermission.None];
        }

        this.permissionsService.loadPermissions(permissions);
      });

      this.loading = false;
    
      if(this.localeRedirect) this.baseAppService.navigateTo(this.localeRedirect);

      setTimeout(() => {
        this.showCurtain = false;
      }, 500);
    } catch (error) {
      if (typeof error == 'string') this.loadError = error;
      else this.loadError = error.message;
    }
  }
}
