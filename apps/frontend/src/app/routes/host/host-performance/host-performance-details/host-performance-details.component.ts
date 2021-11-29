import { ComponentCanDeactivate } from '../../../../_helpers/unsaved-changes.guard';
import { Observable, Subject } from 'rxjs';
import { MatTabGroup } from '@angular/material/tabs';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
  Genre,
  IHost,
  Visibility
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
import { BreadcrumbService } from 'xng-breadcrumb';
import * as lodash from 'lodash';
import { UnsavedChangesDialogComponent } from '@frontend/components/dialogs/unsaved-changes-dialog/unsaved-changes-dialog.component';

// Container component for all of the tabs (details, release, links, keys)
@Component({
  selector: 'app-host-performance-details',
  templateUrl: './host-performance-details.component.html',
  styleUrls: ['./host-performance-details.component.scss']
})
export class HostPerformanceDetailsComponent implements OnInit, ComponentCanDeactivate {
  // Injected from parent router outlet
  host: IHost;
  performanceId: string;
  performanceHostInfo: ICacheable<IPerformanceHostInfo>;
  performance: ICacheable<DtoPerformance>;
  performanceDetails: DtoPerformanceDetails;
  performanceGeneralForm: UiForm<void>; // The forms do not handle submit but instead merge with data from other form to submit
  performanceReleaseForm: UiForm<void>;
  @ViewChild('tabs', { static: false }) tabs: MatTabGroup;

  @ViewChild('checkboxText', { static: false }) checkboxText: ElementRef;

  visibilityFormTouched = false;

  get performanceData() {
    return this.performance.data?.data;
  }

  get performanceType(): string {
    return this.performance?.data?.data?.performance_type === PerformanceType.Vod ? 'Recorded' : 'Livestream';
  }

  get performanceIsLive(): boolean {
    const currentDate = timestamp(new Date());
    const inPremierPeriod: boolean =
      currentDate >= this.performance?.data?.data?.publicity_period.start &&
      currentDate <= this.performance?.data?.data?.publicity_period.end;
    if (this.performance?.data?.data?.performance_type === PerformanceType.Vod && inPremierPeriod) return true;
    else return this.performance?.data?.data?.status === PerformanceStatus.Live;
  }

  get performanceIsCancelled(): boolean {
    return this.performance?.data?.data?.status === PerformanceStatus.Cancelled;
  }

  get performanceIsDraft(): boolean {
    return this.performance?.data?.data?.status === PerformanceStatus.Draft;
  }

  constructor(
    private appService: AppService,
    private helperService: HelperService,
    private dialog: MatDialog,
    private router: Router,
    private performanceService: PerformanceService,
    private toastService: ToastService,
    private breadcrumbService: BreadcrumbService
  ) {}

  async ngOnInit(): Promise<void> {
    this.performanceDetails = {
      short_description: this.performanceData.short_description,
      long_description: this.performanceData.long_description,
      genre: this.performanceData.genre,
      name: this.performanceData.name,
      publicity_period: this.performanceData.publicity_period,
      visibility: this.performanceData.visibility
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
          initial: this.performanceData.genre,
          values: new Map(
            Object.entries(GenreMap).map(([key]) => {
              return [key, { label: genrePipe.transform(key as Genre) }];
            })
          ),
          placeholder: $localize`Select a genre`
        }),
        terms: UiField.Checkbox({
          // Consent will only be false if the performance is still a draft
          initial: !this.performanceIsDraft,
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

    const name = this.performanceData.name ? this.performanceData.name : 'New Event';
    this.breadcrumbService.set('dashboard/performances/:id', name.length > 15 ? `${name.substring(0, 15)}...` : name);

    // Set the checkbox label to display HTML rather than plain string
    // This needs to be done after a full cycle so that the ViewChild element isn't null
    setTimeout(
      () => (this.performanceGeneralForm.fields.terms.options.label = this.checkboxText.nativeElement.innerHTML),
      0
    );
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

  async savePerformanceDetails(): Promise<boolean> {
    // Frontend validation (carried out manually due to nature of the split form)
    if (!this.performanceGeneralForm.group.value.name) {
      // Show validation errors and switch to the first tab
      this.performanceGeneralForm.group.controls.name.markAsTouched();
      this.tabs.selectedIndex = 0;
      this.toastService.emit($localize`You must enter an event title`, ThemeKind.Danger, { duration: 4000 });
      return false;
    } else if (!this.performanceGeneralForm.group.value.terms) {
      this.performanceGeneralForm.group.controls.terms.markAsTouched();
      this.tabs.selectedIndex = 0;
      this.toastService.emit($localize`Please confirm you agree to the terms and conditions`, ThemeKind.Danger, {
        duration: 4000
      });
      return false;
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
      this.performanceDetails.publicity_period = this.getFormPublicityPeriod();
      // Save
      await this.performanceService.updatePerformance(this.performanceData._id, this.performanceDetails);
      this.toastService.emit($localize`Event saved successfully!`, ThemeKind.Accent, {
        duration: 4000
      });
      return true;
    }
  }

  updateVisibility(visible: boolean) {
    this.performanceDetails.visibility = visible ? Visibility.Public : Visibility.Private;
    this.visibilityFormTouched = true;
  }

  goToPerformance(): void {
    this.appService.navigateTo(`/performances/${this.performanceData._id}`);
  }

  getFormPublicityPeriod(): { start: number; end: number } {
    return {
      start: this.performanceReleaseForm.group.value.publicity_period.start
        ? timestamp(this.performanceReleaseForm.group.value.publicity_period.start)
        : null,
      end: this.performanceReleaseForm.group.value.publicity_period.end
        ? timestamp(this.performanceReleaseForm.group.value.publicity_period.end)
        : null
    };
  }

  // TODO: fix host listener so that we can also detect when moving away from the site. Works with javascript 'confirm' dialogs but not for the custom modal
  // @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    // Setup observable so we can wait for the user response before navigating
    const navigateAway = new Subject<boolean>();
    if (this.areUnsavedChanges()) {
      this.helperService.showDialog(
        this.dialog.open(UnsavedChangesDialogComponent),
        async () => {
          // If saving fails, to remain on the page and display error (instead of navigating away and losing changes)
          navigateAway.next(await this.savePerformanceDetails());
        },
        () => {
          navigateAway.next(true);
        }
      );
      // Wait for dialog response before navigating away (unless cancelled)
      return navigateAway;
    } else {
      // If no unsaved changes, we can simply navigate away
      return true;
    }
  }

  areUnsavedChanges(): boolean {
    const { terms, ...excludedTerms } = this.performanceGeneralForm.group.value;
    // i.e. the 'unsaved' form data
    const newFormData = {
      ...this.performanceReleaseForm.group.value,
      ...excludedTerms
    };
    newFormData.publicity_period = this.getFormPublicityPeriod();

    // i.e. the existing 'saved' data
    const oldFormData = { ...this.performanceDetails };
    if (!this.visibilityFormTouched) delete oldFormData.visibility;

    // Check if the 'unsaved' data is equal to 'saved'
    return !lodash.isEqual(newFormData, oldFormData);
  }
}
