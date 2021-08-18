import { Clipboard } from '@angular/cdk/clipboard';
import { Component, OnInit } from '@angular/core';
import { timestamp, unix } from '@core/helpers';
import { DtoPerformance, IAssetStub, IHost, AssetType, IPerformanceHostInfo, Visibility, IPerformance} from '@core/interfaces';
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
  publicityPeriodForm: UiForm;

  constructor(private performanceService: PerformanceService, private clipboard: Clipboard) {}

  ngOnInit(): void {
    this.stream = this.performance.data.data.assets.find(asset => asset.type == AssetType.LiveStream);
    this.vod = this.performance.data.data.assets.find(
      asset => asset.type == AssetType.Video && asset.tags.includes('trailer')
    );

    this.publicityPeriodForm = new UiForm({
      fields: {
        publicity_period: UiField.Date({
          initial:  {
            start: unix(this.performance.data.data.publicity_period.start),
           
            end: unix(this.performance.data.data.publicity_period.end),
           
          },
          is_date_range: true,
          actions: true,
          //min_date: new Date(),
          //max_date: new Date(),
          label: $localize`Schedule`
        })
      },
      handlers: {
        changes: async v => {
          if (v.value['publicity_period'].start && v.value['publicity_period'].end) {
            this.publicityPeriodForm.submit();
          }
        }
      },
      resolvers: {
        output: async v =>
          this.performanceService.updatePublicityPeriod(this.performanceId, {
            start: v.publicity_period.start,
            end:v.publicity_period.end
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
}
