import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AssetDto, AssetType, DtoPerformance } from '@core/interfaces';
import { ChangeImageComponent } from '@frontend/components/dialogs/change-image/change-image.component';
import { HelperService } from '@frontend/services/helper.service';
import { PerformanceService } from '@frontend/services/performance.service';

@Component({
  selector: 'app-host-performance-thumbnails',
  templateUrl: './host-performance-thumbnails.component.html',
  styleUrls: ['./host-performance-thumbnails.component.scss']
})
export class HostPerformanceThumbnailsComponent implements OnInit {
  @Input() performance: DtoPerformance;

  THUMBNAIL_LIMIT: number = 5;

  primaryThumbnail: AssetDto;
  secondaryThumbnails: AssetDto[];

  constructor(
    private helperService: HelperService,
    private dialog: MatDialog,
    private performanceService: PerformanceService
  ) {}

  ngOnInit(): void {
    this.secondaryThumbnails = this.performance.data.assets.filter(
      a => a.type == AssetType.Image && a.tags.includes('thumbnail') && a.tags.includes('secondary')
    );
    this.primaryThumbnail = this.performance.data.assets.find(
      a => a.type == AssetType.Image && a.tags.includes('thumbnail') && a.tags.includes('primary')
    );
  }

  changePrimaryThumbnail() {
    let asset: AssetDto | void;

    this.helperService.showDialog(
      this.dialog.open(ChangeImageComponent, {
        data: {
          initialImage: this.primaryThumbnail?.location,
          fileHandler: async (fd: FormData) => {
            asset = await this.performanceService.changeThumbnails(
              this.performance.data._id,
              fd,
              'primary',
              this.primaryThumbnail?._id
            );

            return asset?.location;
          }
        }
      }),
      () => {
        // Since performance data is cached between performance tabs, need to push it onto the assets array
        this.performance.data.assets.push(asset);
        this.primaryThumbnail = asset;
      }
    );
  }

  changeSecondaryThumbnail(index: number) {
    let asset: AssetDto | void;

    this.helperService.showDialog(
      this.dialog.open(ChangeImageComponent, {
        data: {
          initialImage: this.secondaryThumbnails[index]?.location,
          fileHandler: async (fd: FormData) => {
            asset = await this.performanceService.changeThumbnails(
              this.performance.data._id,
              fd,
              'secondary',
              this.secondaryThumbnails[index]?._id
            );

            return asset?.location;
          }
        }
      }),
      () => {
        // Since performance data is cached between performance tabs, need to push it onto the assets array
        this.performance.data.assets.push(asset);
        this.secondaryThumbnails[index]
          ? this.secondaryThumbnails.splice(index, 1, asset) // replace image
          : (this.secondaryThumbnails[index] = asset); // add new
      }
    );
  }
}
