import { findAssets } from '@core/helpers';
import { Component, OnInit } from '@angular/core';
import { AssetType, DtoPerformance, IAssetStub, ICreateAssetRes, IHost, IPerformanceHostInfo } from '@core/interfaces';
import { Cacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { PerformanceService } from 'apps/frontend/src/app/services/performance.service';
import { UploadEvent } from '@frontend/components/upload-video/upload-video.component';
import { IHostPerformanceComponent } from '../host-performance.component';

@Component({
  selector: 'frontend-host-performance-media',
  templateUrl: './host-performance-media.component.html',
  styleUrls: ['./host-performance-media.component.scss']
})
export class HostPerformanceMediaComponent implements OnInit, IHostPerformanceComponent {
  performanceId: string;
  performanceHostInfo: ICacheable<IPerformanceHostInfo>;
  performance: Cacheable<DtoPerformance>;
  host: IHost;

  trailer: IAssetStub<AssetType.Video>;
  vod: IAssetStub<AssetType.Video>;

  VoDAssetCreator: () => Promise<ICreateAssetRes>;

  constructor(private performanceService: PerformanceService) {}

  ngOnInit(): void {
    // A performance is VOD if the primary assets is of type AssetType.Video
    this.vod = findAssets(this.performance.data.data.assets, AssetType.Video, ['primary'])[0];

    this.VoDAssetCreator = async () =>
      this.performanceService.readVideoAssetSignedUrl(
        this.performance.data.data._id,
        this.performance.data.data.assets.find(a => a.type == AssetType.Video)._id
      );

    this.trailer = findAssets(this.performance.data.data.assets, AssetType.Video, ['trailer'])[0];
  }

  trailerAssetCreator() {
    return this.performanceService.createAsset(this.performance.data.data._id, {
      type: AssetType.Video,
      is_signed: false,
      tags: ['trailer']
    });
  }
}
