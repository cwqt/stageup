import { Clipboard } from '@angular/cdk/clipboard';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { findAssets, timestamp, unix } from '@core/helpers';
import {
  DtoPerformance,
  IAssetStub,
  IHost,
  AssetType,
  IPerformanceHostInfo,
  Visibility,
  PerformanceType,
  PerformanceStatus
} from '@core/interfaces';
import { PerformanceCancelDialogComponent } from '@frontend/routes/performance/performance-cancel-dialog/performance-cancel-dialog.component';
import { PerformanceDeleteDialogComponent } from '@frontend/routes/performance/performance-delete-dialog/performance-delete-dialog.component';
import { AppService } from '@frontend/services/app.service';
import { HelperService } from '@frontend/services/helper.service';
import { UiDialogButton } from '@frontend/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
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

  get isPerformanceLive(): boolean {
    const currentDate = timestamp(new Date());
    const inPremierPeriod: boolean =
      currentDate >= this.performance?.data?.data?.publicity_period.start &&
      currentDate <= this.performance?.data?.data?.publicity_period.end;

    if (this.performance?.data?.data?.performance_type === PerformanceType.Vod && inPremierPeriod) return true;
    else return this.performance?.data?.data?.status === PerformanceStatus.Live;
  }

  get isPerformanceCancelled(): boolean {
    return this.performance?.data?.data?.status === PerformanceStatus.Cancelled;
  }

  visibilityForm: UiForm;
  publicityPeriodForm: UiForm;

  constructor(
    private appService: AppService,
    private route: ActivatedRoute,
    private helperService: HelperService,
    private dialog: MatDialog,
    private router: Router,
    private performanceService: PerformanceService,
    private clipboard: Clipboard
  ) {}

  ngOnInit(): void {
    this.stream = this.performance.data.data.assets.find(asset => asset.type == AssetType.LiveStream);
    this.vod = findAssets(this.performance.data.data.assets, AssetType.Video, ['primary'])[0];

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

  deletePerformance() {
    this.dialog.open(PerformanceDeleteDialogComponent, {
      data: this.performance.data.data
    });
  }

  cancelPerformance() {
    this.dialog.open(PerformanceCancelDialogComponent, {
      data: this.performance.data.data
    });
  }

  async restorePerformance() {
    // Set performance status and publicity period in DB
    await this.performanceService.restorePerformance(this.performanceId);
    // Also set the changes on the front end so we don't have to re-render
    this.performance.data.data.status = PerformanceStatus.PendingSchedule;

    this.helperService.showConfirmationDialog(this.dialog, {
      title: $localize`The schedule for this performance has been reset. Please set a new one.`,
      buttons: [
        new UiDialogButton({
          label: $localize`Later`,
          kind: ThemeKind.Secondary,
          callback: ref => {
            ref.close();
            this.router.navigate(['dashboard/performances']);
          }
        }),
        new UiDialogButton({
          label: $localize`Ok`,
          kind: ThemeKind.Primary,
          callback: ref => {
            ref.close();
          }
        })
      ]
    });
  }

  test() {
    console.log('test');
  }
}
