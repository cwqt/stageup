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

  thumbnails: AssetDto[];

  constructor(
    private helperService: HelperService,
    private dialog: MatDialog,
    private performanceService: PerformanceService
  ) {}

  ngOnInit(): void {
    this.thumbnails = this.performance.data.assets.filter(
      a => a.type == AssetType.Image && a.tags.includes('thumbnail')
    );
  }

  changeThumbnail(index: number) {
    let asset: AssetDto | void;

    this.helperService.showDialog(
      this.dialog.open(ChangeImageComponent, {
        data: {
          initialImage: this.thumbnails[index]?.location,
          fileHandler: async (fd: FormData) => {
            asset = await this.performanceService.changeThumbnails(
              this.performance.data._id,
              fd,
              this.thumbnails[index]?._id
            );

            return asset?.location;
          }
        }
      }),
      () => {
        this.thumbnails[index]
          ? this.thumbnails.splice(index, 1, asset) // replace image
          : (this.thumbnails[index] = asset); // add new
      }
    );
  }
}
