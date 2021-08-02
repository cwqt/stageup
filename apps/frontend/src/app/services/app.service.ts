import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ParamMap, Data, ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { AuthenticationService } from './authentication.service';
import { intersect } from '@core/helpers';
import { SUPPORTED_LOCALES } from '@frontend/app.interfaces';

export enum RouteParam {
  UserId = 'userId',
  HostId = 'hostId',
  PerformanceId = 'performanceId',
  Genre = 'genreType',
  ExternalUrl = 'externalUrl'
}

export enum RouteChange {
  Login = 'login',
  Logout = 'logout',
  Component = 'component',
  Params = 'params'
}

@Injectable({
  providedIn: 'root'
})
export class BaseAppService {
  $params: BehaviorSubject<ParamMap>;
  $queryParams: BehaviorSubject<ParamMap>;
  $routeData: BehaviorSubject<Data>;
  $componentError: BehaviorSubject<boolean>;
  loggedIn: boolean;
  // the boolean is whether the component was changed (initialised)
  // true means it was - false means just route params altered - query param changes are ignored
  $routeAltered: Subject<RouteChange> = new Subject();

  constructor(
    private authenticationService: AuthenticationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.$componentError = new BehaviorSubject(false);
    this.authenticationService.checkLoggedIn();

    this.loggedIn = this.authenticationService.$loggedIn.getValue();
    this.authenticationService.$loggedIn.subscribe((isLoggedIn: boolean) => {
      this.loggedIn = isLoggedIn;
      this.notifyRouteAltered(isLoggedIn ? RouteChange.Login : RouteChange.Logout);
    });

    //this activatedRoute has no params really as have yet to navigate
    this.$params = new BehaviorSubject(this.route.snapshot.paramMap);
    this.$queryParams = new BehaviorSubject(this.route.snapshot.queryParamMap);
    this.$routeData = new BehaviorSubject(this.route.snapshot.data);
  }

  async componentInitialising(activatedRoute: ActivatedRoute) {
    if (this.$componentError.getValue()) this.$componentError.next(false);
    this.$params.next(activatedRoute.snapshot.paramMap);
    this.$queryParams.next(activatedRoute.snapshot.queryParamMap);
    this.$routeData.next(activatedRoute.snapshot.data);

    // subscribe to the params as they can change by navigating to same component with different params
    // don't need to unsubscribe from activate route stuff as auto destroyd by router - it is almost unique in this
    activatedRoute.paramMap.subscribe(async (paramMap: ParamMap) => {
      this.$params.next(paramMap);
    });

    activatedRoute.queryParamMap.subscribe(async (paramMap: ParamMap) => {
      this.$queryParams.next(paramMap);
    });

    activatedRoute.data.subscribe(async (data: Data) => {
      this.$routeData.next(data);
    });

    //do it sync and wait
    await this.paramsUpdated(true);
  }

  // updating stored user permissions as space changes
  async paramsUpdated(reInitialised: boolean) {
    this.notifyRouteAltered(reInitialised ? RouteChange.Component : RouteChange.Params);
  }

  notifyRouteAltered(change: RouteChange) {
    this.$routeAltered.next(change);
  }

  getParam<T = string>(param: RouteParam): T {
    return (this.$params.getValue().get(param) as unknown) as T;
  }

  getQueryParam(paramKey: string) {
    return this.$queryParams.getValue().get(paramKey);
  }

  getData() {
    if (this.$routeData) return this.$routeData.getValue();
  }

  navigateTo(url: string, extras?: NavigationExtras): Promise<boolean> {
    return this.router.navigate([url], extras);
  }

  // router.navigate doesn't support "target='_blank'". Uses window.open with queryParams to enable this.
  navigateToNewTab(baseUrl: string, extras?: NavigationExtras): void {
    const url = this.router.serializeUrl(this.router.createUrlTree([baseUrl], { queryParams: extras?.queryParams }));
    window.open(url, '_blank');
  }

  /**
   * @description Gets the current URL, removing supported locales (if any)
   * */
  getUrl(): string {
    // Get the current route and split to array (e.g. router.url will be ['', 'nb', 'settings'])
    const currentRouteArray = this.router.url.split('/').filter(v => v);

    // Check if the current URL has any locale prefixes
    const hasLocalePrefix =
      intersect(
        SUPPORTED_LOCALES.map(l => l.language),
        [currentRouteArray[0]]
      ).length == 1;

    console.log(currentRouteArray, hasLocalePrefix);

    return hasLocalePrefix ? '/' + currentRouteArray.slice(1).join('/') : this.router.url;
  }
}
