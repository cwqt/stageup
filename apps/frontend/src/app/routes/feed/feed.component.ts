import { Component, OnInit, ViewChildren, QueryList } from '@angular/core';
import { IEnvelopedData as IEnv, IPerformanceStub } from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { FeedService } from 'apps/frontend/src/app/services/feed.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { MatDialog } from '@angular/material/dialog';
import { HelperService } from '../../services/helper.service';
import { PerformanceBrochureComponent } from '../performance/performance-brochure/performance-brochure.component';
import { CarouselComponent } from '@frontend/components/libraries/ivyсarousel/carousel.component';
import { sample, timeout, timestamp } from '@core/helpers';

type CarouselIdx = 'all';

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
    all: createICacheable([], { loading_page: false }),
  };

  constructor(
    private feedService: FeedService,
    public dialog: MatDialog,
    private helperService: HelperService,
    private breakpointObserver: BreakpointObserver
  ) {}

  async ngOnInit() {
    this.getCarouselPage('all');
    // this.getCarouselPage('hosts');
    // this.getCarouselPage('genre');

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

  getCarouselPage(carouselIndex: CarouselIdx) {
    return cachize(this.feedService.getFeed(), this.carouselData[carouselIndex]);
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
    carouselIndex: CarouselIdx  // keyof this.carousel
  ) {
    if(event.name == "click") {
      // open the brochure
      if(event.cellIndex >= 0)
        this.openDialog(this.carouselData[carouselIndex].data.data[event.cellIndex]);
    } else if (event.name == 'next') {
      // get next page in carousel
      const carousel = this.carousels.find(c => ((c.id as unknown) as string) == carouselIndex);

      if (carousel.slide.isLastSlide(carousel.slide.counter + 2)) {
        if(this.carouselData[carouselIndex].meta.loading_page) return;

        console.log('reached last slide');

        // Fetch the next page & push it onto the carousels data array
        this.carouselData[carouselIndex].meta.loading_page = true;
        try {
          await timeout(1000);
          const elements = await this.feedService.getFeed();
          elements.data = elements.data.concat(this.carouselData[carouselIndex].data.data);
          this.carouselData[carouselIndex].data = elements;
        } catch (error) {
          console.error(error);
        } finally {
          this.carouselData[carouselIndex].meta.loading_page = false;
        }

        // Update state of carousel with new pushed elements
        carousel.cellLength = carousel.getCellLength();
        carousel["ref"].detectChanges();
        setTimeout(() => {
          carousel.carousel.lineUpCells();
        },0)
      }
    }
  }
}
