import { ChangeImageComponent } from '@frontend/components/dialogs/change-image/change-image.component';
import { Component, Input, OnInit } from '@angular/core';
import { findAssets } from '@core/helpers';
import { PerformanceService } from '@frontend/services/performance.service';
import { MatDialog } from '@angular/material/dialog';
import { HelperService } from '@frontend/services/helper.service';
import { AssetDto, AssetType, DtoPerformance } from '@core/interfaces';

@Component({
  selector: 'app-host-performance-media-images',
  templateUrl: './host-performance-media-images.component.html',
  styleUrls: ['./host-performance-media-images.component.scss']
})
export class HostPerformanceMediaImagesComponent implements OnInit {
  @Input() performance: DtoPerformance;

  THUMBNAIL_LIMIT: number = 5; // Primary + secondary images

  primaryThumbnail: AssetDto;
  secondaryThumbnails: AssetDto[];

  constructor(
    private helperService: HelperService,
    private dialog: MatDialog,
    private performanceService: PerformanceService
  ) {}

  ngOnInit(): void {
    this.secondaryThumbnails = findAssets(this.performance.data.assets, AssetType.Image, ['thumbnail', 'secondary']);
    this.primaryThumbnail = findAssets(this.performance.data.assets, AssetType.Image, ['thumbnail', 'primary'])[0];
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
