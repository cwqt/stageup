import { Component, OnInit, ViewChildren, QueryList } from '@angular/core';
import { IEnvelopedData as IEnv, IFeed, IPerformanceStub } from '@core/interfaces';
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
    [Breakpoints.Large]: 3,
    [Breakpoints.XLarge]: 6
  };

  carouselData: { [index in CarouselIdx]: ICacheable<IEnv<IPerformanceStub[]>> } = {
    upcoming: createICacheable([], { loading_page: false }),
    everything: createICacheable([], { loading_page: false })
  };

  constructor(
    private feedService: FeedService,
    public dialog: MatDialog,
    private helperService: HelperService,
    private breakpointObserver: BreakpointObserver,
    private toastService: ToastService,
    private logger: NGXLogger
  ) {}

  async ngOnInit() {
    try {
      Object.keys(this.carouselData).forEach(k => (this.carouselData[k].loading = true));
      const feed = await this.feedService.getFeed();
      Object.keys(feed).forEach(k => (this.carouselData[k].data = feed[k]));
    } catch (error) {
      this.toastService.emit('Error occurred fetching feed', ThemeKind.Danger);
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
      this.toastService.emit(`Failed fetching page for ${carouselIndex}`, ThemeKind.Danger);
      throw error;
    } finally {
      this.carouselData[carouselIndex].meta.loading_page = false;
    }
  }

  openDialog(performance: IPerformanceStub): void {
    this.helperService.showDialog(
      this.dialog.open(PerformanceBrochureComponent, {
        data: performance,
        width: '800px',
        position: { top: '5%' }
      }),
      () => {}
    );
  }

  async handleCarouselEvents(
    event,
    carouselIndex: CarouselIdx // keyof this.carousel
  ) {
    if (event.name == 'click') {
      // open the brochure
      if (event.cellIndex >= 0) this.openDialog(this.carouselData[carouselIndex].data.data[event.cellIndex]);
    } else if (event.name == 'next') {
      // get next page in carousel
      const carousel = this.carousels.find(c => ((c.id as unknown) as string) == carouselIndex);

      if (carousel.slide.isLastSlide(carousel.slide.counter)) {
        // Fetch the next page & push it onto the carousels data array
        this.logger.info(`Reached last page of carousel: ${carouselIndex}`);
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
}
