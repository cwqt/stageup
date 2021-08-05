import { Component, OnInit } from '@angular/core';
import { environment } from '../environments/environment';
import { Title } from '@angular/platform-browser';
import { AuthenticationService } from './services/authentication.service';
import { MyselfService } from './services/myself.service';
import { ToastService } from './services/toast.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { AppService } from './services/app.service';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { Environment, UserPermission } from '@core/interfaces';
import { NGXLogger } from 'ngx-logger';
import { filter } from 'rxjs/operators';
import { LOCALE_ID, Inject } from '@angular/core';
import countries from 'i18n-iso-countries';
import { SUPPORTED_LOCALES } from './app.interfaces';
import { intersect } from '@core/helpers';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  loading: boolean = true;
  showCurtain: boolean = false; // show the bouncing icon for a bit longer while the page content is loading
  loadError: string;
  hasCookiePolicySet: boolean = false;

  constructor(
    @Inject(LOCALE_ID) public locale: string,
    private myselfService: MyselfService,
    private titleService: Title,
    private authService: AuthenticationService,
    private toastService: ToastService,
    private appService: AppService,
    private route: ActivatedRoute,
    private permissionsService: NgxPermissionsService,
    private logger: NGXLogger,
    private router: Router
  ) {}

  async ngOnInit() {
    this.titleService.setTitle(`StageUp - ${environment.app_version}`);
    this.locale = this.locale || 'en';

    // Only show pop-up when value is undefined
    this.myselfService.$acceptedCookiesPolicy.subscribe(v => (this.hasCookiePolicySet = v != undefined));

    // Curtain is the bouncing StageUp logo - & loading is the content beneath
    // allow the content beneath to load for a second before revealing the curtain
    this.loading = true;
    this.showCurtain = true;

    // Fetch the dynamic environment from the backend to create the complete environment
    await this.appService.getEnvironment();
    this.logger.debug(`Running in: ${this.appService.environment.environment} with locale ${this.locale}`);

    // Not using nginx in prod which serves many locales, so any links we get in e-mails will result in 404s because
    // of the locale /en/, /no/, /cy/ not existing on serve server - so re-write them out if the url starts with the current locale
    if (this.appService.environment.environment == Environment.Development) {
      this.router.events.pipe(filter(event => event instanceof NavigationStart)).subscribe((event: NavigationStart) => {
        // Check if URL starts with any supported locale language, URL could contain locale, e.g. ["", "cy", "settings"] etc.
        const routeTail = event.url.split('/').filter(p => p)[0];
        if (
          intersect(
            SUPPORTED_LOCALES.map(l => l.language),
            [routeTail]
          ).length == 1
        )
          // Replace tail (language) with nothing in development
          this.router.navigateByUrl(event.url.replace(`/${routeTail}`, '/'));
      });
    }

    // Dynamic require of current LOCALE_ID set from angular
    countries.registerLocale(require(`i18n-iso-countries/langs/${this.locale}.json`));

    await this.appService.componentInitialising(this.route);

    // Upon start up, check if logged in by re-hydrating stored data (if any exists)
    // and then re-fetch the user incase of any changes & set all permissions
    try {
      if (this.authService.checkLoggedIn()) {
        const myself = await this.myselfService.getMyself();
        this.toastService.emit(`Welcome back to StageUp! (${environment.app_version})`);

        // If user is logged in, we will redirect to their preferred language choice when they navigate to the site
        // if (myself.user.locale && environment.environment !== Environment.Development)
        if (environment.is_deployed && this.locale !== myself.user.locale.language)
          // NGINX serves different URLs on subpaths, /en/, /cy/ - but the angular apps' router has no knowledge of that
          // so we have to use window.location to change the _entire_ path from the root upwards
          window.location.href = `${myself.user.locale.language}/${this.appService.getUrl()}`;

        // May be coming in from an e-mail to accept invite stageup.uk/?invite_accepted=...
        if (this.appService.getQueryParam('invite_accepted')) this.appService.navigateTo(`/dashboard`);
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

      this.loading = false;

      setTimeout(() => {
        this.showCurtain = false;
      }, 500);
    } catch (error) {
      if (typeof error == 'string') this.loadError = error;
      else this.loadError = error.message;
    }
  }
}
