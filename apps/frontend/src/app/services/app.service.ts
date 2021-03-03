import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ParamMap, Data, ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { AuthenticationService } from './authentication.service';

export enum RouteParam {
  UserId = 'userId',
  HostId = 'hostId',
  PerformanceId = 'performanceId'
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

  // blockUntilUserLoaded means the user value will be up to date when this returns - avoiding the need to subscribe async to user permission changes for spaces etc.
  async componentInitialising(activatedRoute: ActivatedRoute, blockUntilUserLoaded: boolean = false) {
    if (this.$componentError.getValue()) this.$componentError.next(false);
    this.$params.next(activatedRoute.snapshot.paramMap);
    this.$queryParams.next(activatedRoute.snapshot.queryParamMap);
    this.$routeData.next(activatedRoute.snapshot.data);

    // subscribe to the params as they can change by navigating to same component with different params
    // don't need to unsubscribe from activate route stuff as auto destroyd by router - it is almost unique in this
    activatedRoute.paramMap.subscribe(async (paramMap: ParamMap) => {
      this.$params.next(paramMap);
      //  this.paramsUpdated(false);
    });

    activatedRoute.queryParamMap.subscribe(async (paramMap: ParamMap) => {
      this.$queryParams.next(paramMap);
    });

    activatedRoute.data.subscribe(async (data: Data) => {
      this.$routeData.next(data);
    });

    //do it sync and wait
    if (blockUntilUserLoaded) {
      await this.paramsUpdated(true);
    } else {
      // do it in the background async - timout stops it blocking UI thread after component loaded
      setTimeout(async () => {
        this.paramsUpdated(true);
      }, 0);
    }
  }

  // updating stored user permissions as space changes
  async paramsUpdated(reInitialised: boolean) {
    this.notifyRouteAltered(reInitialised ? RouteChange.Component : RouteChange.Params);
  }

  notifyRouteAltered(change: RouteChange) {
    this.$routeAltered.next(change);
  }

  getParam(param: RouteParam) {
    return this.$params.getValue().get(param.toString());
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
}
