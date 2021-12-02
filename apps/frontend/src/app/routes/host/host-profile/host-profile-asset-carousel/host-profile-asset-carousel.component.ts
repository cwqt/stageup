import { CarouselComponent } from '@frontend/components/libraries/ivyсarousel/carousel.component';
import { ThemeKind } from 'apps/frontend/src/app/ui-lib/ui-lib.interfaces';
import { AssetDto, AssetType, IHost } from '@core/interfaces';
import { HostService } from '@frontend/services/host.service';
import { ChangeImageComponent } from '@frontend/components/dialogs/change-image/change-image.component';
import { MatDialog } from '@angular/material/dialog';
import { HelperService } from '@frontend/services/helper.service';
import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';

@Component({
  selector: 'app-host-profile-asset-carousel',
  templateUrl: './host-profile-asset-carousel.component.html',
  styleUrls: ['./host-profile-asset-carousel.component.scss']
})
export class HostProfileAssetComponent implements OnInit {
  @ViewChild('carousel') carousel: CarouselComponent;

  @Input() host: IHost;
  @Input() isHostView: boolean;

  loading = false;

  constructor(private helperService: HelperService, private dialog: MatDialog, private hostService: HostService) {}

  get clearDark(): ThemeKind {
    return ThemeKind.ClearDark;
  }

  async ngOnInit(): Promise<void> {}

  changeImage(oldAsset?: AssetDto) {
    let newAsset: AssetDto | void;

    this.helperService.showDialog(
      this.dialog.open(ChangeImageComponent, {
        data: {
          initialImage: oldAsset?.location,
          fileHandler: async (fd: FormData) => {
            this.loading = true;
            newAsset = await this.hostService.updateHostAssets(this.host._id, fd, AssetType.Image, oldAsset?._id);
            return newAsset?.location;
          }
        }
      }),
      () => {
        // If just new asset, we add onto the end of the array
        if (newAsset && !oldAsset) this.host.assets.push(newAsset);
        // If just new asset (i.e. user is deleting image), we filter from the array
        else if (oldAsset && !newAsset) {
          this.host.assets = this.host.assets.filter(asset => asset != oldAsset);
        } else if (oldAsset && newAsset) {
          // If new AND old asset (i.e. user is replacing an image), we swap the old asset for the new
          this.host.assets = this.host.assets.map(asset => (asset == oldAsset ? newAsset : asset));
        }
        // Dots need to be manually updated as they are otherwise not re-rendered with the new length
        this.carousel.dotsArr = Array(this.host.assets.length + 1).fill(1);
        setTimeout(() => {
          // Need to allow 1 full cycle for the carousel component to detect the change and refresh
          this.loading = false;
        }, 500);
      },
      () => {
        this.loading = true;
      }
    );
  }
}
