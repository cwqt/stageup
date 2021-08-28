import { Component, Input, OnInit, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { 
  IHost,
  IEnvelopedData,
  IUserFollow,
  IEnvelopedData as IEnv,
  IPerformanceStub,
  IHostStub
} from '@core/interfaces';
import { createICacheable, ICacheable, cachize } from '../../../app.interfaces';
import { AppService, RouteParam } from '../../../services/app.service';
import { HelperService } from '../../../services/helper.service';
import { HostService } from '../../../services/host.service';
import { MyselfService } from '../../../services/myself.service';
import { ChangeImageComponent } from '@frontend/components/dialogs/change-image/change-image.component';
import { HostProfileAboutComponent } from './host-profile-about/host-profile-about.component';
import { HostProfileFeedComponent } from './host-profile-feed/host-profile-feed.component';
import { HostProfilePatronageComponent } from './host-profile-patronage/host-profile-patronage.component';
import { SocialSharingComponent } from '@frontend/components/social-sharing/social-sharing.component';
import { Subscription } from 'rxjs';
import { CarouselComponent } from '@frontend/components/libraries/ivyсarousel/carousel.component';
import { CarouselBaseComponent } from '@frontend/components/carousel-base/carousel-base.component';
import { ToastService } from '@frontend/services/toast.service';
import { ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
import { BreakpointObserver } from '@angular/cdk/layout';
import { NGXLogger } from 'ngx-logger';

@Component({
  selector: 'app-host-profile',
  templateUrl: './host-profile.component.html',
  styleUrls: ['./host-profile.component.scss']
})
export class HostProfileComponent extends CarouselBaseComponent implements OnInit {
  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
  @ViewChildren(CarouselComponent) carousels: QueryList<CarouselComponent>;
  @Input() hostUsername?: string;
  host: ICacheable<IEnvelopedData<IHost, IUserFollow>> = createICacheable();
  isHostView: boolean;
  tabs: Array<{ label: string; route: string }>;
  hostSharingUrl: SocialSharingComponent['url'];
  currentRoutePath: string;
  userFollowing: boolean;
  myselfSubscription: Subscription;

  public carouselData: { ['upcoming']: ICacheable<IEnv<IPerformanceStub[] | IHostStub[]>> } = {
    upcoming: createICacheable([], { loading_page: false }),
  };

  constructor(
    logger: NGXLogger,
    toastService: ToastService,
    hostService: HostService,
    breakpointObserver: BreakpointObserver,
    private myselfService: MyselfService,
    private appService: AppService,
    public route: ActivatedRoute,
    private helperService: HelperService,
    public dialog: MatDialog,    
  ) {
    super({
      logger: logger,
      toastService: toastService,
      breakpointObserver: breakpointObserver,
      hostService: hostService
    });
  }

  async ngOnInit() {
    super.onInit();

    this.tabs = [
      { label: $localize`Feed`, route: '' },
      { label: $localize`About`, route: 'about' },
      { label: $localize`Patronage`, route: 'patronage' },
      { label: $localize`Contact`, route: 'contact' },
      { label: $localize`Merch`, route: null }
    ];

    this.route.url.subscribe(url => {
      this.currentRoutePath = '/dashboard/' + url[0].path.toString();
    });

    // Change view of component depending on if on /dashboard/@user or /@user
    this.isHostView = this.route.snapshot.data['is_host_view'];
    await this.appService.componentInitialising(this.route);

    // If not passed through input, get from route param since this is probably on /@host_username
    if (!this.hostUsername) this.hostUsername = this.appService.getParam(RouteParam.HostId).split('@').pop();

    await cachize(this.hostService.readHostByUsername(this.hostUsername), this.host);

    this.userFollowing = this.host.data.__client_data.is_following;

    try {
      this.carouselData.upcoming.loading = true;
      const hostFeed = await this.hostService.readHostFeedPerformances(
        this.host.data.data._id,
        {
          upcoming: {
            page: 0,
            per_page: 4
          },
        },
      );
      this.carouselData.upcoming.data = hostFeed['upcoming'];
    } catch (error) {
      this.toastService.emit($localize`Error occurred fetching feed`, ThemeKind.Danger);
    } finally {
      this.carouselData.upcoming.loading = false;
    }

    // Wait for tabs to be in the DOM before setting tabGroup selectedIndex to route
    setTimeout(() => {
      this.route.url.subscribe(() => {
        if (this.route.snapshot.firstChild?.url[0]) {
          // Map the selected tab to the URL
          this.tabGroup.selectedIndex = this.tabs.findIndex(
            i => i.route.split('/').pop() == this.route.snapshot.firstChild.url[0].path
          );
        } else {
          this.tabGroup.selectedIndex = 0;
        }
      });
    }, 0);
  }

  onChildLoaded(component: HostProfileAboutComponent | HostProfileFeedComponent | HostProfilePatronageComponent) {
    component.host = this.host.data.data;
  }

  openTabLink(event: MatTabChangeEvent) {
    this.appService.navigateTo(
      `${this.isHostView ? '/dashboard' : ''}/@${this.hostUsername}/${this.tabs[event.index].route}`
    );
  }

  openChangeAvatarDialog() {
    this.helperService.showDialog(
      this.dialog.open(ChangeImageComponent, {
        data: {
          initialImage: this.host.data.data.avatar,
          fileHandler: async (fd: FormData) => this.hostService.changeAvatar(this.host.data.data._id, fd)
        }
      }),
      url => {
        this.host.data.data.avatar = url;
        this.myselfService.setHost({
          ...this.myselfService.$myself.getValue().host,
          avatar: this.host.data.data.avatar
        });
      }
    );
  }

  openChangeBannerDialog() {
    this.helperService.showDialog(
      this.dialog.open(ChangeImageComponent, {
        data: {
          initialImage: this.host.data.data.banner,
          fileHandler: async (fd: FormData) => this.hostService.changeBanner(this.host.data.data._id, fd)
        }
      }),
      url => {
        this.host.data.data.banner = url || '/assets/banner-placeholder.png';
        this.myselfService.setHost({
          ...this.myselfService.$myself.getValue().host,
          banner: this.host.data.data.banner
        });
      }
    );
  }

  openSocialLink(link: string) {
    window.open(this.host.data.data.social_info[link], '_blank');
  }

  originalOrder() {
    return 0;
  }

  followEvent(): void {
    this.userFollowing
      ? this.myselfService.unfollowHost(this.host.data.data._id)
      : this.myselfService.followHost(this.host.data.data._id);
    this.userFollowing = !this.userFollowing;
  }
}
