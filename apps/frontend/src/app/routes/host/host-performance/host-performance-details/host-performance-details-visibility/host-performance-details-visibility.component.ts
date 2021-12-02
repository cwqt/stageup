import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { findAssets } from '@core/helpers';
import { AssetType, IAssetStub, IHost, IPerformance, Visibility } from '@core/interfaces';
import { PerformanceService } from '@frontend/services/performance.service';
import { UiField, UiForm } from '@frontend/ui-lib/form/form.interfaces';

@Component({
  selector: 'app-host-performance-details-visibility',
  templateUrl: './host-performance-details-visibility.component.html',
  styleUrls: ['./host-performance-details-visibility.component.scss']
})
export class HostPerformanceDetailsVisibilityComponent implements OnInit {
  @Input() host: IHost;
  @Input() performance: IPerformance;
  @Output() switchEmitter = new EventEmitter();

  visibilityForm: UiForm;
  minimumAssetsMet: boolean;
  vodAsset: IAssetStub<AssetType.Video>;

  get performanceMeetsAllPublicityRequirements() {
    return this.host.is_onboarded && this.minimumAssetsMet && (this.vodAsset?.location || !this.vodAsset);
  }

  constructor(private performanceService: PerformanceService) {}

  ngOnInit(): void {
    this.minimumAssetsMet = this.performanceHasMinimumAssets();

    this.visibilityForm = new UiForm({
      fields: {
        visibility: UiField.Toggle({
          initial: this.performance.visibility == Visibility.Public,
          left_label: $localize`Public`,
          right_label: $localize`Private`,
          disabled: !this.host.is_onboarded
        })
      },
      resolvers: {
        output: async () => {}
      },
      handlers: {
        changes: async formData => this.switchEmitter.emit(formData.value.visibility)
      }
    });

    if (this.performance.performance_type == 'vod')
      this.vodAsset = findAssets(this.performance.assets, AssetType.Video, ['primary'])[0];
  }

  // Performance needs either a trailer or at least 2 thumbnail images to go public
  performanceHasMinimumAssets(): boolean {
    const trailer = findAssets(this.performance.assets, AssetType.Video, ['trailer']);
    const thumbnails = findAssets(this.performance.assets, AssetType.Image, ['thumbnail']);
    return trailer.length > 0 || thumbnails?.length > 1;
  }
}
