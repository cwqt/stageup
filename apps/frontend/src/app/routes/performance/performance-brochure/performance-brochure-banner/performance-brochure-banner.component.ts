import { Component, EventEmitter, Input, LOCALE_ID, OnInit, Output, ViewChild } from '@angular/core';
import { findAssets } from '@core/helpers';
import { AssetType, DtoPerformance, IAssetStub } from '@core/interfaces';
import { ICacheable } from '@frontend/app.interfaces';
import { PlayerComponent } from '@frontend/components/player/player.component';
import { SocialSharingComponent } from '@frontend/components/social-sharing/social-sharing.component';
import { AppService } from '@frontend/services/app.service';

@Component({
  selector: 'performance-brochure-banner',
  templateUrl: './performance-brochure-banner.component.html',
  styleUrls: ['./performance-brochure-banner.component.scss']
})
export class PerformanceBrochureBannerComponent implements OnInit {
  @ViewChild('trailer') trailerPlayer?: PlayerComponent;
  @Input('performance') performanceCacheable: ICacheable<DtoPerformance>
  @Output() leave = new EventEmitter();

  brochureSharingUrl: SocialSharingComponent['url'];
  performanceTrailer: IAssetStub<AssetType.Video>;  
  thumbnail: IAssetStub<AssetType.Image>;

  constructor(
    private appService: AppService,
  ) {}

  async ngOnInit() {
    if(this.performance) {
      this.brochureSharingUrl = `${this.appService.environment.frontend_url}/?performances/show/${this.performance._id}`;
      this.thumbnail = findAssets(this.performance.assets, AssetType.Image, ['thumbnail', 'primary'])[0];
      this.performanceTrailer = findAssets(this.performance.assets, AssetType.Video, ['trailer'])[0];
    }    
  }

  get performance() {
    return this.performanceCacheable.data?.data;
  }

  leaveEvent() {
    this.leave.emit();
  }
}