import { QueryList } from '@angular/core';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { CarouselComponent } from '@frontend/components/libraries/ivyсarousel/carousel.component';
import { timeout } from '@core/helpers';
import { ToastService } from '@frontend/services/toast.service';
import { ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
import { NGXLogger } from 'ngx-logger';
import { IEnvelopedData as IEnv } from '@core/interfaces';
import { ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { AppModule } from '@frontend/app.module' // or whatever this path to the root app.module.ts file is

const BREAKPOINT_CELLS_SHOWN_MAP: { [index: string]: number } = {
    [Breakpoints.Small]: 1,
    [Breakpoints.Medium]: 2,
    [Breakpoints.Large]: 4,
    [Breakpoints.XLarge]: 6
  };
export class CarouselBaseComponent<T, CarouselIdx> {
    // public to template, consumers should ignore these
    public _activeBreakpoint: string;
    public _currentCellsToShow: number;

    // function that returns carousel items
    private resolver: (index:keyof CarouselIdx) => Promise<IEnv<T[]>>;

    // carousel components themselves
    public carousels: QueryList<CarouselComponent>;
    // indexed object of resolved carousel items
    public carouselData: { [index in keyof CarouselIdx]: ICacheable<IEnv<T[]>> };

    private logger: NGXLogger;
    private toastService:ToastService;
    private breakpointObserver:BreakpointObserver;

    constructor(resolver:(index:keyof CarouselIdx) => Promise<T[]>) {
        // use the IoC container to avoid drilling these up to the parent
        // i haven't tested this but worth a shot
        this.logger = AppModule.injector.get(NGXLogger);
        this.toastService = AppModule.injector.get(ToastService);
        this.breakpointObserver = AppModule.injector.get(BreakpointObserver);

        this.resolver = resolver;
    }

    async onInit() {
        // Change number of cells in a row displayed at any one point depending on screen width
        const breakpoints = Object.keys(BREAKPOINT_CELLS_SHOWN_MAP);
        this.breakpointObserver.observe(breakpoints).subscribe(result => {
            if (result.matches) {
                this._activeBreakpoint = breakpoints.find(breakpoint => result.breakpoints[breakpoint]);
                this._currentCellsToShow = BREAKPOINT_CELLS_SHOWN_MAP[this._activeBreakpoint];
            }
        });
    }

    public async getNextCarouselPage(
        carouselIndex: keyof CarouselIdx,
    ) {
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
            const envelope = await this.resolver(carouselIndex);
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
        carouselIndex: keyof CarouselIdx,
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
}
