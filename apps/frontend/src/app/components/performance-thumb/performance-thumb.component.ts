import { findAssets } from '@core/helpers';
import { MyselfService } from '@frontend/services/myself.service';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AssetTags, AssetType, IAssetStub, IMyself, IPerformanceStub, LikeLocation, NUUID } from '@core/interfaces';
import { PerformanceBrochureComponent } from '@frontend/routes/performance/performance-brochure/performance-brochure.component';
import { HelperService } from '@frontend/services/helper.service';
import { PerformanceService } from '@frontend/services/performance.service';
import { ToastService } from '@frontend/services/toast.service';
import { ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-performance-thumb',
  templateUrl: './performance-thumb.component.html',
  styleUrls: ['./performance-thumb.component.scss']
})
export class PerformanceThumbComponent implements OnInit {
  @Input() performance: IPerformanceStub;
  @Input() userLiked: boolean;

  @Output() onFollowEvent = new EventEmitter();
  @Output() onLike = new EventEmitter();

  myself: IMyself;
  thumbnail: IAssetStub<AssetType.Image>;

  constructor(
    private helperService: HelperService,
    private dialog: MatDialog,
    private myselfService: MyselfService,
    private performanceService: PerformanceService,
    private toastService: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    this.myself = this.myselfService.$myself.value;

    // See if there's a thumbnail on this performance to set the cover image
    this.thumbnail = findAssets(this.performance.assets, AssetType.Image, ['thumbnail', 'primary'])[0];
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

    const likeSubscription = dialogRef.componentInstance.onLike.subscribe(data => {
      this.likePerformance(data);
    });
    const followSubscription = dialogRef.componentInstance.onFollowEvent.subscribe(data => {
      this.onFollowEvent.emit(data);
    });

    dialogRef.afterClosed().subscribe(() => {
      likeSubscription.unsubscribe();
      followSubscription.unsubscribe();
    });
  }

  async likePerformance(value: boolean) {
    this.userLiked = value;
    this.performanceService
      .toggleLike(this.performance._id, LikeLocation.Thumb)
      .then(() => {
        this.onLike.emit({ performance: this.performance._id, value });
      })
      .catch(() =>
        this.toastService.emit($localize`An error occured while liking, try again later`, ThemeKind.Warning)
      );
  }
}
