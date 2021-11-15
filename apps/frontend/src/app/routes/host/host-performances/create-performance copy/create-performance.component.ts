import { Component, EventEmitter, Inject, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AssetType, GenreMap, ICreateAssetRes, IPerformance, PerformanceType } from '@core/interfaces';
import { AppService } from 'apps/frontend/src/app/services/app.service';
import { ToastService } from 'apps/frontend/src/app/services/toast.service';
import { UiDialogButton } from 'apps/frontend/src/app/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { HostService } from '../../../../services/host.service';
import { UiField, UiForm } from '../../../../ui-lib/form/form.interfaces';
import { IUiDialogOptions, ThemeKind } from '../../../../ui-lib/ui-lib.interfaces';
import { timestamp } from '@core/helpers';
import { MatHorizontalStepper } from '@angular/material/stepper';
import { PerformanceService } from '@frontend/services/performance.service';
import { Cacheable } from '@frontend/app.interfaces';
import { merge, Observable } from 'rxjs';
import { UploadEvent } from '@frontend/components/upload-video/upload-video.component';
import { GdprService } from '@frontend/services/gdpr.service';

@Component({
  selector: 'app-create-performance',
  templateUrl: './create-performance.component.html',
  styleUrls: ['./create-performance.component.scss']
})
export class CreatePerformanceComponent implements OnInit, IUiDialogOptions {
  @ViewChild('stepper') stepper: MatHorizontalStepper;
  form: UiForm<IPerformance>;
  type: PerformanceType;
  VoDAssetCreator: () => Promise<ICreateAssetRes>;
  VoDSignedUrl: Cacheable<ICreateAssetRes> = new Cacheable();
  performance: IPerformance;
  acceptedStreamingTerms: boolean;

  loading: Observable<boolean>;
  @Output() submit = new EventEmitter();
  @Output() cancel = new EventEmitter();
  buttons: UiDialogButton[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { host_id: string },
    private ref: MatDialogRef<CreatePerformanceComponent>,
    private performanceService: PerformanceService,
    private hostService: HostService,
    private toastService: ToastService,
    private appService: AppService,
    private gdprService: GdprService
  ) {}

  setType(type: 'live' | 'vod') {
    type === 'live' ? (this.type = PerformanceType.Live) : (this.type = PerformanceType.Vod);
    this.stepper.next();
  }

  ngOnInit(): void {
    this.form = new UiForm({
      fields: {
        name: UiField.Text({
          label: $localize`Performance Title`,
          validators: [{ type: 'required' }, { type: 'maxlength', value: 64 }]
        }),
        description: UiField.Richtext({
          label: $localize`Description`,
          validators: [{ type: 'maxlength', value: 512 }]
        }),
        genre: UiField.Select({
          label: $localize`Genre`,
          validators: [{ type: 'required' }],
          values: new Map(
            // TODO: Localize genres
            Object.entries(GenreMap).map(([key, value]) => {
              return [key, { label: value as string }];
            })
          )
        }),
        publicity_period: UiField.Date({
          label: $localize`Schedule`,
          separator: 'above',
          hint: $localize`Set the start and end date for your event`,
          is_date_range: true,
          actions: true
        }),
        terms: UiField.Checkbox({
          label: $localize`I'm in compliance with the licenses required to stream this production. I have read the uploaders terms and conditions to stream a production legally`,
          validators: [{ type: 'required' }]
        })
      },
      resolvers: {
        output: async v => {
          this.acceptedStreamingTerms = v.terms;

          return this.hostService.createPerformance(this.hostService.hostId, {
            name: v.name,
            description: v.description,
            genre: v.genre,
            publicity_period: {
              start: v.publicity_period ? timestamp(v.publicity_period.start) : null, //Specifying schedule at this stage optional, hence null
              end: v.publicity_period ? timestamp(v.publicity_period.end) : null
            },
            type: this.type === 'live' ? PerformanceType.Live : PerformanceType.Vod
          });
        }
      },
      handlers: {
        success: async v => {
          this.performance = v;
          this.toastService.emit($localize`Created performance: ${v.name}!`);
          if (this.type == 'vod') {
            // VoD performances have their assets created at the same time as the performance
            // so all we need to do is pass the fn that returns the pre-created, pre-signed URL
            this.VoDAssetCreator = async () =>
              this.performanceService.readVideoAssetSignedUrl(v._id, v.assets.find(a => a.type == AssetType.Video)._id);
            this.stepper.next();
          } else {
            // live
            this.appService.navigateTo(`/dashboard/performances/${v._id}`);
            this.ref.close(v);
          }
          this.gdprService.updateStreamCompliance(
            this.acceptedStreamingTerms,
            this.hostService.hostId,
            this.performance._id
          );
        },
        failure: async () => {}
      }
    });

    // Top-level loading state for the ui-dialog
    this.loading = merge(this.form.loading, this.VoDSignedUrl.$loading);

    this.buttons = [
      new UiDialogButton({
        label: $localize`Cancel`,
        kind: ThemeKind.Secondary,
        callback: () => this.ref.close()
      }),
      new UiDialogButton({
        label: $localize`Create`,
        kind: ThemeKind.Primary,
        callback: () => this.form.submit()
      }).attach(this.form)
    ];
  }

  handleVoDUploadChange(event: UploadEvent) {
    if (event == 'success') {
      this.appService.navigateTo(`/dashboard/performances/${this.performance._id}`);
      this.ref.close(this.performance);
    }
  }
}
