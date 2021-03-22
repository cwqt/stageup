import { Component, OnInit } from '@angular/core';
import { IEnvelopedData as IEnv, IPerformanceStub } from '@core/interfaces';
import { cachize, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';
import { FeedService } from 'apps/frontend/src/app/services/feed.service';

import { MatDialog } from '@angular/material/dialog';
import { HelperService } from '../../services/helper.service';
import { PerformanceBrochureComponent } from '../performance/performance-brochure/performance-brochure.component';

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss']
})
export class FeedComponent implements OnInit {
  performances: ICacheable<IEnv<IPerformanceStub[], void>> = {
    data: null,
    error: '',
    loading: false
  };

  constructor(
    private feedService: FeedService,
    private appService: BaseAppService,
    public dialog: MatDialog,
    private helperService: HelperService
  ) {}

  ngOnInit(): void {
    this.getFeed();
  }

  getFeed() {
    return cachize(this.feedService.getFeed(), this.performances);
  }

  openDialog(performance: IPerformanceStub): void {
    this.helperService.showDialog(
      this.dialog.open(PerformanceBrochureComponent, {
        data: performance,
        position: { top: "5% "}
      }),
      () => {}
    );
  }
}
