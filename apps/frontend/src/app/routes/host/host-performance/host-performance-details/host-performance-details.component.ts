import { Clipboard } from '@angular/cdk/clipboard';
import { Component, OnInit } from '@angular/core';
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

  copyMessage: string = $localize`Copy`;
  visibilityInput: IUiFormField<'select'>;

  get performanceData() {
    return this.performance.data?.data;
  }
  get phiData() {
    return this.performanceHostInfo.data;
  }

  visibilityForm: UiForm;

  constructor(private performanceService: PerformanceService, private clipboard: Clipboard) {}

  ngOnInit(): void {
    this.stream = this.performance.data.data.assets.find(asset => asset.type == AssetType.LiveStream);
    this.vod = this.performance.data.data.assets.find(
      asset => asset.type == AssetType.Video && asset.tags.includes('trailer')
    );

    this.visibilityForm = new UiForm({
      fields: {
        visibility: UiField.Select({
          label: $localize`Performance Visibility`,
          multi_select: false,
          has_search: false,
          initial: this.performanceData.visibility,
          disabled: !this.host.is_onboarded,
          values: new Map([
            [Visibility.Private, { label: $localize`Private` }],
            [Visibility.Public, { label: $localize`Public` }]
          ])
        })
      },
      resolvers: {
        output: v => this.performanceService.updateVisibility(this.performanceId, v.visibility)
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
}
