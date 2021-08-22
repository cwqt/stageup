import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { 
  IHost,
  IHostStub,
  IEnvelopedData,
  IUserFollow,
  IEnvelopedData as IEnv,
  IFeed,
  IPerformanceStub
} from '@core/interfaces';
import fd from 'form-data';
import { cachize, createICacheable, ICacheable } from '../../../app.interfaces';
import { AppService, RouteParam } from '../../../services/app.service';
import { HelperService } from '../../../services/helper.service';
import { HostService } from '../../../services/host.service';
import { MyselfService } from '../../../services/myself.service';
import { ChangeImageComponent } from '@frontend/components/dialogs/change-image/change-image.component';
import { HostProfileAboutComponent } from './host-profile-about/host-profile-about.component';
import { HostProfileFeedComponent } from './host-profile-feed/host-profile-feed.component';
import { HostProfilePatronageComponent } from './host-profile-patronage/host-profile-patronage.component';
import { SocialSharingComponent } from '@frontend/components/social-sharing/social-sharing.component';
import { environment } from 'apps/frontend/src/environments/environment';
import { Subscription } from 'rxjs';
import { CarouselComponent } from '@frontend/components/libraries/ivyсarousel/carousel.component';
import { ToastService } from '@frontend/services/toast.service';
import { FeedService } from 'apps/frontend/src/app/services/feed.service';
import { ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { NGXLogger } from 'ngx-logger';
import { timeout } from '@core/helpers';

type CarouselIdx = keyof IFeed;

@Component({
  selector: 'app-host-profile',
  templateUrl: './host-profile.component.html',
  styleUrls: ['./host-profile.component.scss']
})
export class HostProfileComponent implements OnInit {
  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
  @ViewChild(CarouselComponent) carousel: CarouselComponent;
  @Input() hostUsername?: string;
  host: ICacheable<IEnvelopedData<IHost, IUserFollow>> = createICacheable();
  isHostView: boolean;
  tabs: Array<{ label: string; route: string }>;
  hostSharingUrl: SocialSharingComponent['url'];
  currentRoutePath: string;
  userFollowing: boolean;
  myselfSubscription: Subscription;

  constructor(
    private myselfService: MyselfService,
    private appService: AppService,
    public route: ActivatedRoute,
    private hostService: HostService,
    private helperService: HelperService,
    public dialog: MatDialog,
    private toastService: ToastService,
    private feedService: FeedService,
    private breakpointObserver: BreakpointObserver,
    private logger: NGXLogger,
  ) {}

  activeBreakpoint: string;
  currentCellsToShow: number;
  breakpointCellShownMap: { [index: string]: number } = {
    [Breakpoints.Small]: 1,
    [Breakpoints.Medium]: 2,
    [Breakpoints.Large]: 4,
    [Breakpoints.XLarge]: 6
  };

  carouselData: { [index in CarouselIdx]: ICacheable<IEnv<IPerformanceStub[] | IHostStub[]>> } = {
    upcoming: createICacheable([], { loading_page: false }),
    everything: createICacheable([], { loading_page: false }),
    hosts: createICacheable([], { loading_page: false }),
    follows: createICacheable([], { loading_page: false })
  };

  async ngOnInit() {
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

    // Get the host by username & populate the ICacheable
    await cachize(this.hostService.readHostByUsername(this.hostUsername), this.host);

    this.userFollowing = this.host.data.__client_data.is_following;

    try {
      this.carouselData.upcoming.loading = true;
      const feed = await this.feedService.getFeed(
        {
          upcoming: {
            page: 0,
            per_page: 4
          },
        },
        // TODO: when logged in and not the _id can be accessed differently
        {  hid: this.host._id }
      );
      this.carouselData.upcoming.data = feed.upcoming;
    } catch (error) {
      this.toastService.emit($localize`Error occurred fetching feed`, ThemeKind.Danger);
    } finally {
      this.carouselData.upcoming.loading = false;
    }

    console.log(this.carouselData.upcoming);

    const breakpoints = Object.keys(this.breakpointCellShownMap);
    this.breakpointObserver.observe(breakpoints).subscribe(result => {
      if (result.matches) {
        for (let i = 0; i < breakpoints.length; i++) {
          if (result.breakpoints[breakpoints[i]]) {
            this.activeBreakpoint = breakpoints[i];
            this.currentCellsToShow = this.breakpointCellShownMap[this.activeBreakpoint];
            // this.carousels.forEach(c => c.carousel.lineUpCells());
            break;
          }
        }
      }
    });

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

  // TODO: make it drier by making these functions commonly used, from the feed page too
  
  async getNextCarouselPage() {
    // Already fetching page or no more pages to fetch
    if (this.carouselData.upcoming.meta.loading_page) return;
    if (!this.carouselData.upcoming.data.__paging_data.next_page) {
      this.logger.info('No next page for carousel upcoming');
      return;
    }

    // Use loading_page over cache.loading to prevent carousel from being destroyed
    this.carouselData.upcoming.meta.loading_page = true;
    try {
      await timeout(1000);
      
      // Get the next page for this carousel by passing the index along to the backend
      const envelope = (
        await this.feedService.getFeed(
          {
            upcoming: {
              page: this.carouselData.upcoming.data.__paging_data.next_page,
              per_page: this.carouselData.upcoming.data.__paging_data.per_page
            },
          },
          { hid: this.host._id }
        )
      ).upcoming;

      // Then join this page onto the current array at the end
      envelope.data = [...this.carouselData.upcoming.data.data, ...envelope.data];
      this.carouselData.upcoming.data = envelope;
    } catch (error) {
      this.toastService.emit($localize`Failed fetching page for upcoming`, ThemeKind.Danger);
      throw error;
    } finally {
      this.carouselData.upcoming.meta.loading_page = false;
    }
  }

  async handleCarouselEvents(
    event
    //carouselIndex: CarouselIdx // keyof this.carousel
  ) {
    if (event.name == 'next') {
      // get next page in carousel
      const carousel = this.carousel;

      if (carousel.slide.isLastSlide(carousel.slide.counter)) {
        // Fetch the next page & push it onto the carousels data array
        this.logger.info('Reached last page of carousel upcoming');
        await this.getNextCarouselPage();

        // Update state of carousel with new pushed elements
        carousel.cellLength = carousel.getCellLength();
        carousel['ref'].detectChanges();
        setTimeout(() => {
          carousel.carousel.lineUpCells();
        }, 0);
      }
    }
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
