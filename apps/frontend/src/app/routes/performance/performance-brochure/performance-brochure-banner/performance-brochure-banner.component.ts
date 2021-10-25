import { Component, EventEmitter, Inject, Input, LOCALE_ID, OnInit, Output, ViewChild } from '@angular/core';
import { findAssets } from '@core/helpers';
import { AssetType, DtoPerformance, IAssetStub } from '@core/interfaces';
import { ICacheable } from '@frontend/app.interfaces';
import { PlayerComponent } from '@frontend/components/player/player.component';
import { SocialSharingComponent } from '@frontend/components/social-sharing/social-sharing.component';
import { AppService } from '@frontend/services/app.service';

@Component({
  selector: 'app-performance-brochure-banner',
  templateUrl: './performance-brochure-banner.component.html',
  styleUrls: ['./performance-brochure-banner.component.scss']
})
export class PerformanceBrochureBannerComponent implements OnInit {
  @ViewChild('trailer') trailerPlayer?: PlayerComponent;
  @Input('performance') performanceCacheable: ICacheable<DtoPerformance>

  _brochureSharingUrl: SocialSharingComponent['url'];
  _performanceTrailer: IAssetStub<AssetType.Video>;  
  _thumbnail: IAssetStub<AssetType.Image>;

  constructor(
    private appService: AppService,
    @Inject(LOCALE_ID) public locale: string
  ) {}

  async ngOnInit() {}

  get performance() {
    return this.performanceCacheable.data?.data;
  }

  get brochureSharingUrl () {
    if (!this._brochureSharingUrl) {
      const loc: string = this.locale ? `/${this.locale}` : '';
      this._brochureSharingUrl = `${this.appService.environment.frontend_url}${loc}/performances/show/${this.performance._id}`;
    }
    return this._brochureSharingUrl;
  }

  get thumbnail() {
    if (!this._thumbnail) {
      this._thumbnail = findAssets(this.performance.assets, AssetType.Image, ['thumbnail', 'primary'])[0];
    }
    return this._thumbnail;
  }

  get performanceTrailer() {
    if (!this._performanceTrailer) {
      this._performanceTrailer = findAssets(this.performance.assets, AssetType.Image, ['thumbnail', 'primary'])[0];
    }
    return this._performanceTrailer;
  }
}
