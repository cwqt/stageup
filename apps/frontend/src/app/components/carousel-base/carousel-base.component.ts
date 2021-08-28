import { QueryList } from '@angular/core';
import { IFeed } from '@core/interfaces';
import { FeedService } from 'apps/frontend/src/app/services/feed.service';
import { HostService } from 'apps/frontend/src/app/services/host.service';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { CarouselComponent } from '@frontend/components/libraries/ivyсarousel/carousel.component';
import { timeout } from '@core/helpers';
import { ToastService } from '@frontend/services/toast.service';
import { ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
import { NGXLogger } from 'ngx-logger';

type CarouselIdx = keyof IFeed;

export class CarouselBaseComponent {
    public carousels: QueryList<CarouselComponent>;

    public activeBreakpoint: string;
    public currentCellsToShow: number;
    public breakpointCellShownMap: { [index: string]: number } = {
      [Breakpoints.Small]: 1,
      [Breakpoints.Medium]: 2,
      [Breakpoints.Large]: 4,
      [Breakpoints.XLarge]: 6
    };

    public carouselData;

    protected logger: NGXLogger;
    protected toastService: ToastService;
    protected breakpointObserver: BreakpointObserver;
    protected feedService?: FeedService;
    protected hostService?: HostService;

    constructor({
        logger,
        toastService,
        breakpointObserver,
        feedService,
        hostService,
    }: {
        logger: NGXLogger,
        toastService: ToastService,
        breakpointObserver: BreakpointObserver,
        feedService?: FeedService,
        hostService?: HostService,
    }) {
        this.logger = logger;
        this.toastService = toastService;
        this.breakpointObserver = breakpointObserver;
        this.feedService = feedService;
        this.hostService = hostService;
    }

    async onInit() {
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

            let envelope;
            
            // Get the next page for this carousel by passing the index along to the backend
            if (hid) {
                envelope = (
                    await this.hostService.readHostFeedPerformances(
                        hid,
                        {
                            [carouselIndex]: {
                                page: this.carouselData[carouselIndex].data.__paging_data.next_page,
                                per_page: this.carouselData[carouselIndex].data.__paging_data.per_page
                            }
                        },    
                    )
                )[carouselIndex];
            } else {
                envelope = (
                    await this.feedService.getFeed({
                            [carouselIndex]: {
                                page: this.carouselData[carouselIndex].data.__paging_data.next_page,
                                per_page: this.carouselData[carouselIndex].data.__paging_data.per_page
                            }
                        }
                    )
                )[carouselIndex];
            }            

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