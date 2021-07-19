import { MyselfService } from '@frontend/services/myself.service';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { IMyself, IPerformanceStub } from '@core/interfaces';
import { PerformanceBrochureComponent } from '@frontend/routes/performance/performance-brochure/performance-brochure.component';
import { HelperService } from '@frontend/services/helper.service';

@Component({
  selector: 'app-performance-thumb',
  templateUrl: './performance-thumb.component.html',
  styleUrls: ['./performance-thumb.component.scss']
})
export class PerformanceThumbComponent implements OnInit {
  @Input() performance: IPerformanceStub;
  @Input() userLiked: boolean;

  @Output() onFollowEvent = new EventEmitter();
  @Output() onLikeEvent = new EventEmitter();

  myself: IMyself;

  constructor(private helperService: HelperService, private dialog: MatDialog, private myselfService: MyselfService) {}

  async ngOnInit(): Promise<void> {
    this.myself = this.myselfService.$myself.value;
  }

  setLikeValue(value: boolean) {
    this.userLiked = value;
    this.onLikeEvent.emit({ performance: this.performance._id, value });
  }

  openBrochure(): void {
    let dialogRef: MatDialogRef<PerformanceBrochureComponent>;
    // Send both the performance stub and an 'output' event emitter to the performance brochure component.
    // When a user clicks to 'follow' or 'unfollow' a host it will trigger the emitter and refresh the 'My Follows' feed.
    const envelope = { performance: this.performance, onFollowEvent: this.onFollowEvent };
    this.helperService.showDialog(
      (dialogRef = this.dialog.open(PerformanceBrochureComponent, {
        data: envelope,
        width: '1000px'
      }))
    );

    const sub = dialogRef.componentInstance.onLikeEvent.subscribe(data => {
      this.setLikeValue(data);
    });

    dialogRef.afterClosed().subscribe(() => {
      sub.unsubscribe();
    });
  }
}
