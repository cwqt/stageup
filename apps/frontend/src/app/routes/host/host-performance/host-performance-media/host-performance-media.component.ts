import { Component, OnInit } from '@angular/core';
import { AssetType, DtoPerformance, IAssetStub, IHost, IPerformanceHostInfo } from '@core/interfaces';
import { ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { PerformanceService } from 'apps/frontend/src/app/services/performance.service';

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

  asset: IAssetStub<AssetType.Video>;

  constructor(private performanceService: PerformanceService) {}

  ngOnInit(): void {
    this.asset = this.performance.data.data.assets.find(a => a.type == AssetType.Video && a.tags.includes('trailer'));
  }

  assetCreator() {
    return this.performanceService.createAsset(this.performance.data.data._id, {
      type: AssetType.Video,
      is_signed: false,
      tags: ['trailer']
    });
  }
}
