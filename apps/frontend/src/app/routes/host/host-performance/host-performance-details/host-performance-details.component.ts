import { Clipboard } from '@angular/cdk/clipboard';
import { Component, OnInit } from '@angular/core';
import { findAssets, timestamp, unix } from '@core/helpers';
import { DtoPerformance, IAssetStub, IHost, AssetType, IPerformanceHostInfo, Visibility } from '@core/interfaces';
import { cachize, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { PerformanceService } from 'apps/frontend/src/app/services/performance.service';
import { IUiFormField, UiField, UiForm } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';

@Component({
  selector: 'app-host-performance-details',
  templateUrl: './host-performance-details.component.html',
  styleUrls: ['./host-performance-details.component.scss']
})
export class HostPerformanceDetailsComponent implements OnInit {
  // Injected from parent router outlet
  performanceId: string;
  performanceHostInfo: ICacheable<IPerformanceHostInfo>;
  performance: ICacheable<DtoPerformance>;
  host: IHost;

  // TODO: temporary until multi-asset
  stream: IAssetStub<AssetType.LiveStream>;
  vod: IAssetStub<AssetType.Video>;

  minimumAssetsMet: boolean;

  copyMessage: string = $localize`Copy`;
  visibilityInput: IUiFormField<'select'>;

  get performanceData() {
    return this.performance.data?.data;
  }
  get phiData() {
    return this.performanceHostInfo.data;
  }

  get performanceMeetsAllPublicityRequirements() {
    return this.host.is_onboarded && this.minimumAssetsMet && (this.vod?.location || !this.vod);
  }

  visibilityForm: UiForm;
  publicityPeriodForm: UiForm;

  constructor(private performanceService: PerformanceService, private clipboard: Clipboard) {}

  ngOnInit(): void {
    this.stream = this.performance.data.data.assets.find(asset => asset.type == AssetType.LiveStream);
    this.vod = this.performance.data.data.assets.find(
      asset => asset.type == AssetType.Video && asset.tags.includes('primary')
    );

    this.minimumAssetsMet = this.performanceHasMinimumAssets();

    this.publicityPeriodForm = new UiForm({
      fields: {
        period: UiField.Date({
          initial: {
            start: this.performanceData.publicity_period.start
              ? unix(this.performanceData.publicity_period.start)
              : undefined,
            end: this.performanceData.publicity_period.end ? unix(this.performanceData.publicity_period.end) : undefined
          },
          is_date_range: true,
          actions: true,
          min_date: new Date(),
          label: $localize`Publicity Period`
        })
      },
      handlers: {
        changes: async v => {
          if (v.value['period'].start && v.value['period'].end) {
            this.publicityPeriodForm.submit();
          }
        }
      },
      resolvers: {
        output: async v =>
          this.performanceService.updatePublicityPeriod(this.performanceId, {
            start: timestamp(v.period.start),
            end: timestamp(v.period.end)
          })
      }
    });

    this.visibilityForm = new UiForm({
      fields: {
        visibility: UiField.Toggle({
          initial: this.performanceData.visibility == Visibility.Public,
          left_label: $localize`Public`,
          right_label: $localize`Private`,
          disabled: !this.host.is_onboarded
        })
      },
      resolvers: {
        output: v =>
          this.performanceService.updateVisibility(
            this.performanceId,
            v.visibility ? Visibility.Public : Visibility.Private
          )
      },
      handlers: {
        changes: async () => this.visibilityForm.submit()
      }
    });
  }

  readStreamingKey() {
    return cachize(this.performanceService.readPerformanceHostInfo(this.performanceId), this.performanceHostInfo);
  }

  copyStreamKeyToClipboard() {
    this.clipboard.copy(this.performanceHostInfo.data.stream_key);
    this.copyMessage = $localize`Copied!`;
    setTimeout(() => {
      this.copyMessage = $localize`Copy`;
    }, 2000);
  }

  // Performance needs either a trailer or at least 2 thumbnail images to go public
  performanceHasMinimumAssets(): boolean {
    const trailer = findAssets(this.performance.data.data.assets, AssetType.Video, ['trailer']);
    const thumbnails = findAssets(this.performance.data.data.assets, AssetType.Image, ['thumbnail']);
    return trailer.length > 0 || thumbnails?.length > 1;
  }
}
