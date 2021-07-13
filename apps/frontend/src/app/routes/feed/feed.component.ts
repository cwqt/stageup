import { Component, OnInit, ViewChildren, QueryList } from '@angular/core';
import { Genre, IEnvelopedData as IEnv, IFeed, IPerformanceStub, GenreMap, IHostStub } from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { FeedService } from 'apps/frontend/src/app/services/feed.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { MatDialog } from '@angular/material/dialog';
import { HelperService } from '../../services/helper.service';
import { PerformanceBrochureComponent } from '../performance/performance-brochure/performance-brochure.component';
import { CarouselComponent } from '@frontend/components/libraries/ivyсarousel/carousel.component';
import { sample, timeout, timestamp } from '@core/helpers';
import { ToastService } from '@frontend/services/toast.service';
import { ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
import { NGXLogger } from 'ngx-logger';
import { BaseAppService } from '@frontend/services/app.service';

type CarouselIdx = keyof IFeed;

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss']
})
export class FeedComponent implements OnInit {
  @ViewChildren(CarouselComponent) carousels: QueryList<CarouselComponent>;

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
    private feedService: FeedService,
    public dialog: MatDialog,
    private helperService: HelperService,
    private breakpointObserver: BreakpointObserver,
    private toastService: ToastService,
    private logger: NGXLogger,
    private appService: BaseAppService
  ) {}

  async ngOnInit() {
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

    // Change number of cells in a row displayed at any one point depending on screen width
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
  }

  async getNextCarouselPage(carouselIndex: CarouselIdx) {
    // Already fetching page or no more pages to fetch
    if (this.carouselData[carouselIndex].meta.loading_page) return;
    if (!this.carouselData[carouselIndex].data.__paging_data.next_page) {
      this.logger.info(`No next page for carousel ${carouselIndex}`);
      return;
    }

    // Use loading_page over cache.loading to prevent carousel from being destroyed
    this.carouselData[carouselIndex].meta.loading_page = true;
    try {
      await timeout(1000);

      // Get the next page for this carousel by passing the index along to the backend
      const envelope = (
        await this.feedService.getFeed({
          [carouselIndex]: {
            page: this.carouselData[carouselIndex].data.__paging_data.next_page,
            per_page: this.carouselData[carouselIndex].data.__paging_data.per_page
          }
        })
      )[carouselIndex];

      // Then join this page onto the current array at the end
      envelope.data = [...this.carouselData[carouselIndex].data.data, ...envelope.data];
      this.carouselData[carouselIndex].data = envelope;
    } catch (error) {
      this.toastService.emit($localize`Failed fetching page for ${carouselIndex}`, ThemeKind.Danger);
      throw error;
    } finally {
      this.carouselData[carouselIndex].meta.loading_page = false;
    }
  }

  async handleCarouselEvents(
    event,
    carouselIndex: CarouselIdx // keyof this.carousel
  ) {
    if (event.name == 'next') {
      // get next page in carousel
      const carousel = this.carousels.find(c => ((c.id as unknown) as string) == carouselIndex);

      if (carousel.slide.isLastSlide(carousel.slide.counter)) {
        // Fetch the next page & push it onto the carousels data array
        this.logger.info('Reached last page of carousel: ${carouselIndex}');
        await this.getNextCarouselPage(carouselIndex);

        // Update state of carousel with new pushed elements
        carousel.cellLength = carousel.getCellLength();
        carousel['ref'].detectChanges();
        setTimeout(() => {
          carousel.carousel.lineUpCells();
        }, 0);
      }
    }
  }

  openGenreFeed(genre: Genre) {
    this.appService.navigateTo(`/genres/${genre}`);
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
}
