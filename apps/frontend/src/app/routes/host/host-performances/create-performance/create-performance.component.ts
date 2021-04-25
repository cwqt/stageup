import { EventEmitter, Component, Inject, OnInit, Output, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DtoCreatePerformance, CurrencyCode, GenreMap, IPerformance } from '@core/interfaces';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';
import { ToastService } from 'apps/frontend/src/app/services/toast.service';
import { UiDialogButton } from 'apps/frontend/src/app/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import {} from 'events';
import { createICacheable, ICacheable } from '../../../../app.interfaces';
import { HostService } from '../../../../services/host.service';
import { FormComponent } from '../../../../ui-lib/form/form.component';
import { IUiForm, UiField, UiForm } from '../../../../ui-lib/form/form.interfaces';
import { IUiDialogOptions, ThemeKind } from '../../../../ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-create-performance',
  templateUrl: './create-performance.component.html',
  styleUrls: ['./create-performance.component.scss']
})
export class CreatePerformanceComponent implements OnInit, IUiDialogOptions {
  form: UiForm<IPerformance>;

  @Output() submit = new EventEmitter();
  @Output() cancel = new EventEmitter();
  buttons: UiDialogButton[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { host_id: string },
    private ref: MatDialogRef<CreatePerformanceComponent>,
    private hostService: HostService,
    private toastService: ToastService,
    private baseAppService: BaseAppService
  ) {}

  ngOnInit(): void {
    this.form = new UiForm({
      fields: {
        name: UiField.Text({
          label: 'Performance Title',
          validators: [{ type: 'required' }, { type: 'maxlength', value: 64 }]
        }),
        description: UiField.Textarea({
          label: 'Description',
          validators: [{ type: 'maxlength', value: 512 }]
        }),
        genre: UiField.Select({
          label: 'Genre',
          validators: [{ type: 'required' }],
          values: new Map(
            Object.entries(GenreMap).map(([key, value]) => {
              return [key, { label: value as string }];
            })
          )
        }),
        date: UiField.Container({
          label: 'Premiere Date',
          separator: 'above',
          hint: 'Schedule the performance to be released at a certain date & time (optional)',
          fields: {
            premiere_date: UiField.Date({ label: 'Date' }),
            premiere_time: UiField.Time({ label: 'Time' })
          }
        })
      },
      resolvers: {
        output: async v =>
          this.hostService.createPerformance(this.hostService.hostId, {
            name: v.name,
            description: v.description,
            genre: v.genre,
            premiere_date: v.date.premiere_date
              ? new Date(v.date.premiere_date).getTime() / 1000 + v.date.premiere_time
              : null
          })
      },
      handlers: {
        success: async v => {
          this.toastService.emit(`Created performance: ${v.name}!`);
          this.baseAppService.navigateTo(`/dashboard/performances/${v._id}`);
          this.ref.close(v);
        },
        failure: async () => this.ref.close(null)
      }
    });

    this.buttons = [
      new UiDialogButton({
        label: 'Cancel',
        kind: ThemeKind.Secondary,
        callback: () => this.ref.close()
      }),
      new UiDialogButton({
        label: 'Create',
        kind: ThemeKind.Primary,
        callback: () => this.form.submit()
      }).attach(this.form)
    ];
  }
}
