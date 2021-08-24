import { ActivatedRoute } from '@angular/router';
import { PerformanceBrochureComponent } from './../performance/performance-brochure/performance-brochure.component';
import { Component, OnInit, ViewChildren, QueryList } from '@angular/core';
import { Genre, IEnvelopedData as IEnv, IFeed, IPerformanceStub, GenreMap, IHostStub } from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { FeedService } from 'apps/frontend/src/app/services/feed.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HelperService } from '../../services/helper.service';
import { CarouselComponent } from '@frontend/components/libraries/ivyсarousel/carousel.component';
import { timeout } from '@core/helpers';
import { ToastService } from '@frontend/services/toast.service';
import { ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
import { NGXLogger } from 'ngx-logger';
import { AppService } from '@frontend/services/app.service';

type CarouselIdx = keyof IFeed;

//I'll figure it out in a bit
// @Component({
//     // selector: 'carousel-base',
//     // template: ``
//     selector: 'app-cookies-consent',
//     templateUrl: '',
//     styleUrls: []
// })
// if it's a component it will need the constructor and all
// implements OnInit
export class CarouselBaseComponent {
    // I might do this from the child
    //@ViewChildren(CarouselComponent) public carousels: QueryList<CarouselComponent>;

    public carousels: QueryList<CarouselComponent>;
    public logger: NGXLogger;

    public activeBreakpoint: string;
    public currentCellsToShow: number;
    public breakpointCellShownMap: { [index: string]: number } = {
      [Breakpoints.Small]: 1,
      [Breakpoints.Medium]: 2,
      [Breakpoints.Large]: 4,
      [Breakpoints.XLarge]: 6
    };

    public toastService: ToastService;
    public feedService: FeedService;

    // constructor() {}
    
    public carouselData: { [index in CarouselIdx]: ICacheable<IEnv<IPerformanceStub[] | IHostStub[]>> } = {
        upcoming: createICacheable([], { loading_page: false }),
        everything: createICacheable([], { loading_page: false }),
        hosts: createICacheable([], { loading_page: false }),
        follows: createICacheable([], { loading_page: false })
      };

    // why am I getting this error --> figure out in a bit
    public async getNextCarouselPage(carouselIndex: CarouselIdx, hid?: string) {
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
                    },
                    { hid: hid }
                )
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

    public async handleCarouselEvents(
        event,
        carouselIndex: CarouselIdx, // keyof this.carousel
        hid?: string
    ) {
        if (event.name == 'next') {
            // get next page in carousel
            const carousel = this.carousels.find(c => ((c.id as unknown) as string) == carouselIndex);

            if (carousel.slide.isLastSlide(carousel.slide.counter)) {
            // Fetch the next page & push it onto the carousels data array
            this.logger.info('Reached last page of carousel: ${carouselIndex}');
            await this.getNextCarouselPage(carouselIndex, hid);

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