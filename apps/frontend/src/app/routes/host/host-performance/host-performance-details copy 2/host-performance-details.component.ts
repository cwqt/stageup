import { MatTabGroup } from '@angular/material/tabs';
import { IUiFormData } from './../../../../ui-lib/form/form.interfaces';
import { Clipboard } from '@angular/cdk/clipboard';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { findAssets, timestamp, unix } from '@core/helpers';
import {
  AssetType,
  DtoPerformance,
  IAssetStub,
  IHost,
  DtoPerformanceDetails,
  IPerformanceHostInfo,
  PerformanceType,
  PerformanceStatus,
  Visibility
} from '@core/interfaces';
import { PerformanceCancelDialogComponent } from '@frontend/routes/performance/performance-cancel-dialog/performance-cancel-dialog.component';
import { AppService } from '@frontend/services/app.service';
import { HelperService } from '@frontend/services/helper.service';
import { UiDialogButton } from '@frontend/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
import { cachize, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { PerformanceService } from 'apps/frontend/src/app/services/performance.service';
import { IUiFormField, UiField, UiForm } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';
import { FormGroup } from '@angular/forms';

// Container component for all of the tabs (details, release, links, keys)
@Component({
  selector: 'app-host-performance-details',
  templateUrl: './host-performance-details.component.html',
  styleUrls: ['./host-performance-details.component.scss']
})
export class HostPerformanceDetailsComponent implements OnInit {
  // Injected from parent router outlet
  performanceHostInfo: ICacheable<IPerformanceHostInfo>;
  performance: ICacheable<DtoPerformance>;
  performanceDetails: DtoPerformanceDetails; // TODO: Add type - will need to set all fields as optional data since the host can save at any point when entering the performance details
  hostHasConsented: boolean = false;

  @ViewChild('tabs', { static: false }) tabs: MatTabGroup;
  test: any;

  get performanceData() {
    return this.performance.data?.data;
  }

  get performanceType(): string {
    return this.performance?.data?.data?.performance_type === PerformanceType.Vod ? 'Recorded' : 'Livestream';
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

  constructor(
    private appService: AppService,
    private helperService: HelperService,
    private dialog: MatDialog,
    private router: Router,
    private performanceService: PerformanceService
  ) {}

  async ngOnInit(): Promise<void> {
    this.performanceDetails = {
      short_description: this.performanceData.short_description,
      long_description: this.performanceData.long_description,
      genre: this.performanceData.genre,
      name: this.performanceData.name,
      publicity_period: this.performanceData.publicity_period
    };

    // Get the userHostInfo (with stream_key) for the live performance
    // Note, the seeded performance 'The Ghost Stories of E R Benson' is live but does not have a key
    if (this.performanceType == 'Livestream')
      await cachize(
        this.performanceService.readPerformanceHostInfo(this.performanceData._id),
        this.performanceHostInfo
      );
  }

  cancelPerformance() {
    this.dialog.open(PerformanceCancelDialogComponent, {
      data: this.performance.data.data
    });
  }

  async restorePerformance() {
    // Set performance status and publicity period in DB
    await this.performanceService.restorePerformance(this.performanceData._id);
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

  // Todo: add longDescription and shortDescription instead of just 'description'
  updatePerformanceDetailsData(formData: FormGroup): void {
    this.test = formData;
    this.hostHasConsented = formData.value.terms;
    delete formData.value.terms;
    this.performanceDetails = { ...this.performanceDetails, ...formData.value };
  }

  async savePerformanceDetails() {
    // Frontend validation (carried out manually due to nature of the split form)
    if (
      !this.test ||
      !this.performanceDetails.name ||
      this.performanceDetails.name.length == 0 ||
      !this.hostHasConsented
    ) {
      this.test.controls.name.markAsTouched();
      this.test.controls.terms.markAsTouched();
      this.tabs.selectedIndex = 0;

      // TODO: Display form errors
      // console.log('Error');
    } else {
      // Submit to backend
      // await this.performanceService.updatePerformance(this.performanceData._id, this.performanceDetails);
      // console.log('this.performanceDetails', this.performanceDetails);
    }
  }

  goToPerformance(): void {
    this.appService.navigateTo(`/performances/${this.performanceData._id}`);
  }
}
