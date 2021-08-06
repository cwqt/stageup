import { MyselfService } from '@frontend/services/myself.service';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AssetTags, AssetType, IAssetStub, IMyself, IPerformanceStub } from '@core/interfaces';
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
  thumbnail: IAssetStub<AssetType.Image>;

  constructor(private helperService: HelperService, private dialog: MatDialog, private myselfService: MyselfService) {}

  async ngOnInit(): Promise<void> {
    this.myself = this.myselfService.$myself.value;

    // See if there's a thumbnail on this performance to set the cover image
    this.thumbnail = this.performance.assets.find(a => a.type == AssetType.Image && a.tags.includes('thumbnail'));
  }

  setLikeValue(value: boolean) {
    this.userLiked = value;
    this.onLikeEvent.emit({ performance: this.performance._id, value });
  }

  openBrochure(): void {
    let dialogRef: MatDialogRef<PerformanceBrochureComponent>;
    // Send both the performance stub and an 'output' event emitter to the performance brochure component.
    // When a user clicks to 'follow' or 'unfollow' a host it will trigger the emitter and refresh the 'My Follows' feed.
    const envelope = { performance_id: this.performance._id };
    this.helperService.showDialog(
      (dialogRef = this.dialog.open(PerformanceBrochureComponent, {
        data: envelope,
        width: '1000px'
      }))
    );

    const likeSubscription = dialogRef.componentInstance.onLikeEvent.subscribe(data => {
      this.setLikeValue(data);
    });
    const followSubscription = dialogRef.componentInstance.onFollowEvent.subscribe(data => {
      this.onFollowEvent.emit(data);
    });

    dialogRef.afterClosed().subscribe(() => {
      likeSubscription.unsubscribe();
      followSubscription.unsubscribe();
    });
  }
}
