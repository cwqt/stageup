import { ActivatedRoute } from '@angular/router';
import { PerformanceBrochureComponent } from './../performance/performance-brochure/performance-brochure.component';
import { Component, OnInit, ViewChildren, QueryList } from '@angular/core';
import { Genre, GenreMap, IEnvelopedData as IEnv, IFeed, IPerformanceStub, IHostStub } from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { CarouselBaseComponent } from '@frontend/components/carousel-base/carousel-base.component';
import { FeedService } from 'apps/frontend/src/app/services/feed.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HelperService } from '../../services/helper.service';
import { CarouselComponent } from '@frontend/components/libraries/ivyсarousel/carousel.component';
import { ToastService } from '@frontend/services/toast.service';
import { ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
import { NGXLogger } from 'ngx-logger';
import { AppService } from '@frontend/services/app.service';

type CarouselIdx = keyof IFeed;

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss']
})
export class FeedComponent extends CarouselBaseComponent<IPerformanceStub | IHostStub, IFeed> implements OnInit {
  @ViewChildren(CarouselComponent) carousels: QueryList<CarouselComponent>;

  public carouselData: { [index in CarouselIdx]: ICacheable<IEnv<IPerformanceStub[] | IHostStub[]>> } = {
    upcoming: createICacheable([], { loading_page: false }),
    everything: createICacheable([], { loading_page: false }),
    hosts: createICacheable([], { loading_page: false }),
    follows: createICacheable([], { loading_page: false })
  };

  prettyKeys: { [index in CarouselIdx]: string } = {
    hosts: $localize`Performing Arts Companies`,
    upcoming: $localize`Upcoming`,
    everything: $localize`Everything`,
    follows: $localize`My Follows`
  };

  genres: {
    [index in Genre]: {
      label: typeof GenreMap[index];
      gradient: string;
      small?: boolean;
    };
  } = {
    [Genre.Dance]: { label: $localize`Dance`, gradient: 'linear-gradient(to right, #6a3093, #a044ff)' },
    [Genre.Classical]: { label: $localize`Classical`, gradient: 'linear-gradient(to right, #b24592, #f15f79);' },
    [Genre.Contemporary]: {
      label: $localize`Contemp.`,
      gradient: 'linear-gradient(to right, #403a3e, #be5869);',
      small: true
    },
    [Genre.Family]: { label: $localize`Family`, gradient: 'linear-gradient(to right, #76b852, #8dc26f);' },
    [Genre.Theatre]: { label: $localize`Theatre`, gradient: 'linear-gradient(to right, #f46b45, #eea849);' },
    [Genre.Ballet]: { label: $localize`Ballet`, gradient: 'linear-gradient(to right, #f46b45, #eea849);' },
    [Genre.Country]: { label: $localize`Country`, gradient: 'linear-gradient(to right, #f46b45, #eea849);' },
    [Genre.Music]: { label: $localize`Music`, gradient: 'linear-gradient(to right, #6a3093, #a044ff)' },
    [Genre.Networking]: { label: $localize`Networking`, gradient: 'linear-gradient(to right, #f46b45, #eea849);' },
    [Genre.Opera]: { label: $localize`Opera`, gradient: 'linear-gradient(to right, #6a3093, #a044ff)' },
    [Genre.Poetry]: { label: $localize`Poetry`, gradient: 'linear-gradient(to right, #403a3e, #be5869);' },
    [Genre.Orchestra]: { label: $localize`Orchestra`, gradient: 'linear-gradient(to right, #f46b45, #eea849);' }
  };

  constructor(
    toastService: ToastService,
    logger: NGXLogger,
    breakpointObserver: BreakpointObserver,
    private feedService: FeedService,
    public dialog: MatDialog,
    private helperService: HelperService,
    private appService: AppService,
    private route: ActivatedRoute
  ) {
    super(logger, toastService, breakpointObserver);

    // setting fetchData separately as this is not accessible on super()
    super.fetchData = this.fetchFeed.bind(null, this.feedService, this.carouselData);
  }

  async ngOnInit() {
    super.onInit();

    try {
      // Set all carousels to loading
      Object.keys(this.carouselData).forEach(k => (this.carouselData[k].loading = true));
      const feed = await this.feedService.getFeed();
      // Add all feed data their first page
      Object.keys(feed).forEach(k => (this.carouselData[k].data = feed[k]));
    } catch (error) {
      this.toastService.emit($localize`Error occurred fetching feed`, ThemeKind.Danger);
    } finally {
      Object.keys(this.carouselData).forEach(k => (this.carouselData[k].loading = false));
    }

    this.route.queryParams.subscribe(params => {
      if (params.performance) this.openBrochure(params.performance);
    });
  }

  openGenreFeed(genre: Genre) {
    this.appService.navigateTo(`/genres/${genre}`);
  }

  async fetchFeed(
    feedService: FeedService,
    carouselData: ICacheable<IEnv<IPerformanceStub[] | IHostStub[]>>,
    carouselIndex: CarouselIdx
  ): Promise<IEnv<(IPerformanceStub | IHostStub)[]>> {
    return (
      await feedService.getFeed({
        [carouselIndex]: {
          page: carouselData[carouselIndex].data.__paging_data.next_page,
          per_page: carouselData[carouselIndex].data.__paging_data.per_page
        }
      })
    )[carouselIndex];
  }

  // Refresh the feed of the given carousel index
  async refreshFeed(carouselIndex: CarouselIdx = 'follows') {
    // Since we are refreshing, start at page 0
    await cachize(
      this.feedService.getFeed({
        [carouselIndex]: {
          page: 0,
          per_page: 4 // The default, as per inside myself.controller
        }
      }),
      this.carouselData[carouselIndex]
    );
    this.carouselData[carouselIndex].data = this.carouselData[carouselIndex].data[carouselIndex];
  }

  // Function that syncs the like in other feeds when a user likes a thumbnail in a particular feed
  syncLikes($event) {
    // Nested forEach used because of type conflict when using flatMap function. Using typeguard to differentiate performance/hosts could be another option in future.
    Object.values(this.carouselData).forEach(feed => {
      feed.data?.data?.forEach(performance => {
        if (performance._id === $event.performance) performance.client_likes = $event.value;
      });
    });
  }

  openBrochure(performanceId: string): void {
    let dialogRef: MatDialogRef<PerformanceBrochureComponent>;
    const envelope = { performance_id: performanceId };
    this.helperService.showDialog(
      (dialogRef = this.dialog.open(PerformanceBrochureComponent, {
        data: envelope,
        width: '1000px'
      }))
    );
    // Event listeners for like and follow events inside the MatDialog
    const likeSubscription = dialogRef.componentInstance.onLike.subscribe(data => {
      this.syncLikes({ performance: performanceId, value: data });
    });
    const followSubscription = dialogRef.componentInstance.onFollowEvent.subscribe(data => {
      this.refreshFeed(data);
    });

    dialogRef.afterClosed().subscribe(() => {
      likeSubscription.unsubscribe();
      followSubscription.unsubscribe();
    });
  }
}
