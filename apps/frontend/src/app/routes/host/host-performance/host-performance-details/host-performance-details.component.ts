import { MatTabGroup } from '@angular/material/tabs';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { timestamp, unix } from '@core/helpers';
import {
  DtoPerformance,
  DtoPerformanceDetails,
  IPerformanceHostInfo,
  PerformanceType,
  PerformanceStatus,
  GenreMap,
  Genre
} from '@core/interfaces';
import { PerformanceCancelDialogComponent } from '@frontend/routes/performance/performance-cancel-dialog/performance-cancel-dialog.component';
import { AppService } from '@frontend/services/app.service';
import { HelperService } from '@frontend/services/helper.service';
import { UiDialogButton } from '@frontend/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
import { cachize, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { PerformanceService } from 'apps/frontend/src/app/services/performance.service';
import { UiField, UiForm } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';
import { GenrePipe } from '@frontend/_pipes/genre.pipe';
import { ToastService } from '@frontend/services/toast.service';

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
  performanceGeneralForm: UiForm<void>; // The forms do not handle submit but instead merge with data from other table to submit
  performanceReleaseForm: UiForm<void>;
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
    private performanceService: PerformanceService,
    private toastService: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    // Combination of both forms data
    this.performanceDetails = {
      short_description: this.performanceData.short_description,
      long_description: this.performanceData.long_description,
      genre: this.performanceData.genre,
      name: this.performanceData.name,
      publicity_period: this.performanceData.publicity_period
    };

    const genrePipe = new GenrePipe();
    this.performanceGeneralForm = new UiForm({
      fields: {
        name: UiField.Text({
          label: $localize`Event Title`,
          initial: this.performanceData.name,
          validators: [{ type: 'required' }, { type: 'maxlength', value: 100 }],
          placeholder: $localize`Enter a title`
        }),
        short_description: UiField.Richtext({
          label: $localize`Short Description`,
          initial: this.performanceData.short_description,
          validators: [{ type: 'maxlength', value: 260 }]
        }),
        long_description: UiField.Richtext({
          label: $localize`Long Description`,
          initial: this.performanceData.long_description,
          validators: [{ type: 'maxlength', value: 1000 }]
        }),
        genre: UiField.Select({
          label: $localize`Genre`,
          values: new Map(
            Object.entries(GenreMap).map(([key]) => {
              return [key, { label: genrePipe.transform(key as Genre) }];
            })
          ),
          placeholder: $localize`Select a genre`
        }),
        terms: UiField.Checkbox({
          // If the host has previously saved then they must have provided consent
          // More efficient than doing another server call (but perhaps less robust?)
          initial: this.performanceData.name ? true : false,
          label: $localize`I'm in compliance with the licenses required to stream this production. I have read the uploaders terms and conditions to stream a production legally.`,
          validators: [{ type: 'required' }]
        })
      },
      resolvers: {
        output: async () => {}
      },
      handlers: {
        changes: async () => {}
      }
    });

    this.performanceReleaseForm = new UiForm({
      fields: {
        publicity_period: UiField.Date({
          initial: {
            start: this.performanceData.publicity_period.start
              ? unix(this.performanceData.publicity_period.start)
              : undefined,
            end: this.performanceData.publicity_period.end ? unix(this.performanceData.publicity_period.end) : undefined
          },
          is_date_range: true,
          actions: true,
          min_date: new Date(),
          label: $localize`Event Visibility Schedule`
        })
      },
      resolvers: {
        output: async () => {}
      },
      handlers: {
        changes: async () => {}
      }
    });
    // Get the userHostInfo (with stream_key) for the live performance
    // Note, the seeded performance 'The Ghost Stories of E R Benson' is live but does not have a key
    if (this.performanceType == 'Livestream') this.readStreamKey();
  }

  async readStreamKey(): Promise<void> {
    await cachize(this.performanceService.readPerformanceHostInfo(this.performanceData._id), this.performanceHostInfo);
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

  async savePerformanceDetails() {
    // Frontend validation (carried out manually due to nature of the split form)
    if (!this.performanceGeneralForm.group.value.name) {
      // Show validation errors and switch to the first tab
      this.performanceGeneralForm.group.controls.name.markAsTouched();
      this.tabs.selectedIndex = 0;
      this.toastService.emit($localize`You must enter an event title`, ThemeKind.Danger, { duration: 4000 });
    } else if (!this.performanceGeneralForm.group.value.terms) {
      this.performanceGeneralForm.group.controls.terms.markAsTouched();
      this.tabs.selectedIndex = 0;
      this.toastService.emit($localize`Please confirm you agree to the terms and conditions`, ThemeKind.Danger, {
        duration: 4000
      });
    } else {
      // If we have reached here, the host has ticked the consent checkbox so we don't need to send this data
      const { terms, ...excludedTerms } = this.performanceGeneralForm.group.value;
      // Compile the form data
      this.performanceDetails = {
        ...this.performanceDetails,
        ...this.performanceReleaseForm.group.value,
        ...excludedTerms
      };
      // Convert publicity period to unix
      this.performanceDetails.publicity_period = {
        start: this.performanceReleaseForm.group.value.publicity_period
          ? timestamp(this.performanceReleaseForm.group.value.publicity_period.start)
          : null,
        end: this.performanceReleaseForm.group.value.publicity_period
          ? timestamp(this.performanceReleaseForm.group.value.publicity_period.end)
          : null
      };
      // Save
      await this.performanceService.updatePerformance(this.performanceData._id, this.performanceDetails);
    }
  }

  goToPerformance(): void {
    this.appService.navigateTo(`/performances/${this.performanceData._id}`);
  }
}
