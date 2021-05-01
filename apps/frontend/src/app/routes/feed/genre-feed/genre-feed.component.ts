import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EnumFilterOperator, Genre, IEnvelopedData, IPerformanceStub, Filters } from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from '@frontend/app.interfaces';
import { BaseAppService, RouteParam } from '@frontend/services/app.service';
import { PerformanceService } from '@frontend/services/performance.service';

@Component({
  selector: 'app-genre-feed',
  templateUrl: './genre-feed.component.html',
  styleUrls: ['./genre-feed.component.scss']
})
export class GenreFeedComponent implements OnInit {
  genre: Genre;
  performances: ICacheable<IEnvelopedData<IPerformanceStub[]>> = createICacheable([]);

  constructor(
    private appService: BaseAppService,
    private route: ActivatedRoute,
    private performanceService: PerformanceService
  ) {}

  async ngOnInit() {
    await this.appService.componentInitialising(this.route);
    this.genre = this.appService.getParam(RouteParam.Genre);

    await cachize(
      this.performanceService.readPerfomances({
        filter: { genre: Filters.ENUM(EnumFilterOperator.Contains, this.genre) }
      }),
      this.performances
    );
  }
}
