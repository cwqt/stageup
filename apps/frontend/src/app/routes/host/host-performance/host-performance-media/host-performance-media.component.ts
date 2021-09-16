import { Component, OnInit } from '@angular/core';
import {
  AssetType,
  DtoPerformance,
  GenreMap,
  IAssetStub,
  ICreateAssetRes,
  IHost,
  IPerformanceHostInfo,
  IPerformance
} from '@core/interfaces';
import { ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { PerformanceService } from 'apps/frontend/src/app/services/performance.service';
import { UploadEvent } from '@frontend/components/upload-video/upload-video.component';

@Component({
  selector: 'frontend-host-performance-media',
  templateUrl: './host-performance-media.component.html',
  styleUrls: ['./host-performance-media.component.scss']
})
export class HostPerformanceMediaComponent implements OnInit {
  performanceId: string;
  performanceHostInfo: ICacheable<IPerformanceHostInfo>;
  performance: ICacheable<DtoPerformance>;
  host: IHost;

  trailer: IAssetStub<AssetType.Video>;
  vod: IAssetStub<AssetType.Video>;

  VoDAssetCreator: () => Promise<ICreateAssetRes>;

  constructor(private performanceService: PerformanceService) {}

  ngOnInit(): void {
    // A performance is VOD if the primary assets is of type AssetType.Video
    this.vod = this.performance.data.data.assets.find(a => a.type == AssetType.Video && a.tags.includes('primary'));

    this.VoDAssetCreator = async () =>
      this.performanceService.readVideoAssetSignedUrl(
        this.performance.data.data._id,
        this.performance.data.data.assets.find(a => a.type == AssetType.Video)._id
      );

    this.trailer = this.performance.data.data.assets.find(a => a.type == AssetType.Video && a.tags.includes('trailer'));
    console.log('this.trailer', this.trailer);
  }

  trailerAssetCreator() {
    return this.performanceService.createAsset(this.performance.data.data._id, {
      type: AssetType.Video,
      is_signed: false,
      tags: ['trailer']
    });
  }

  handleVideoUploadChange(event: UploadEvent) {
    if (event == 'success') {
      console.log('SUCCESS!');
    }
  }
}
