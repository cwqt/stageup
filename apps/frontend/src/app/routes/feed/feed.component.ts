import { Component, OnInit } from '@angular/core';
import { IEnvelopedData as IEnv, IPerformanceStub } from '@eventi/interfaces';
import { ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';
import { FeedService } from 'apps/frontend/src/app/services/feed.service';

import {MatDialog, MatDialogRef, MatDialogConfig, MAT_DIALOG_DATA} from '@angular/material/Dialog';
import { PerformanceModalComponent } from './../../components/modals/performance-modal.component';

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss']
})
export class FeedComponent implements OnInit {
  /* Modal Variables */
  animal: string;
  name: string;

  performances:ICacheable<IEnv<IPerformanceStub[], void>> = {
    data: null,
    error: "",
    loading: false
  }

  constructor(
    private feedService:FeedService, 
    private appService:BaseAppService,
    public dialog: MatDialog
    ) { }

  ngOnInit(): void {
    this.getFeed();
  }

  getFeed() {
    this.performances.loading = true;
    this.feedService.getFeed()
      .then(p => this.performances.data = p)
      .catch(e => this.performances.error = e)
      .finally(() => this.performances.loading = false);
  }

  gotoPerformance(performanceIdx:number) {
    const performance = this.performances.data.data[performanceIdx];
    this.appService.navigateTo(`performance/${performance._id}`, {
      state: { performance }
    })    
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(PerformanceModalComponent, {});  

    dialogRef.afterClosed().subscribe(result => {});
  }  
}
