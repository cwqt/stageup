import { EventEmitter, Component, Inject, OnInit, Output, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DtoCreatePerformance, CurrencyCode, GenreMap, IPerformance } from '@core/interfaces';
import {} from 'events';
import { createICacheable, ICacheable } from '../../../app.interfaces';
import { HostService } from '../../../services/host.service';
import { FormComponent } from '../../../ui-lib/form/form.component';
import { IUiForm } from '../../../ui-lib/form/form.interfaces';
import { IUiDialogOptions, ThemeKind } from '../../../ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-create-performance',
  templateUrl: './create-performance.component.html',
  styleUrls: ['./create-performance.component.scss']
})
export class CreatePerformanceComponent implements OnInit, IUiDialogOptions {
  @ViewChild('form') form: FormComponent;

  createPerformanceForm: IUiForm<IPerformance>;
  performance: ICacheable<IPerformance> = createICacheable();

  @Output() submit = new EventEmitter();
  @Output() cancel = new EventEmitter();
  buttons: IUiDialogOptions['buttons'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { host_id: string },
    private ref: MatDialogRef<CreatePerformanceComponent>,
    private hostService: HostService
  ) {}

  ngOnInit(): void {
    this.createPerformanceForm = {
      fields: {
        name: {
          type: 'text',
          label: 'Performance title',
          validators: [{ type: 'required' }]
        },
        description: {
          type: 'textarea',
          label: 'Description',
          validators: [{ type: 'maxlength', value: 100 }]
        },
        price: {
          type: 'number',
          label: 'Price',
          validators: [{ type: 'maxlength', value: 100 }]
        },
        genre: {
          type: 'select',
          label: 'Genre',
          validators: [{ type: 'required' }],
          options: {
            values: Object.entries(GenreMap).map(([key, value]) => {
              return { key: key, value: value };
            })
          }
        },
        date: {
          type: 'container',
          label: 'Premiere date',
          hint: "Schedule the performance to be released at a certain date & time (optional)",
          fields: {
            premiere_date: {
              type: 'date',
              label: 'Date'
            },
            premiere_time: {
              type: 'time',
              label: 'Time'
            }
          }
        }
      },
      submit: {
        isHidden: true,
        text: 'Create',
        variant: 'primary',
        handler: async v => this.hostService.createPerformance(this.data.host_id, v),
        transformer: (v):DtoCreatePerformance => ({
          name: v.name,
          description: v.description,
          genre: v.genre,
          premiere_date: ((new Date(v.date.premiere_date).getTime() / 1000) + v.date.premiere_time),
          price: v.price,
          currency: CurrencyCode.GBP
        })
      }
    };

    this.buttons = [
      {
        text: 'Cancel',
        kind: ThemeKind.Secondary,
        disabled: false,
        callback: () => this.ref.close()
      },
      {
        text: 'Create',
        kind: ThemeKind.Primary,
        disabled: true,
        callback: () => this.form.onSubmit()
      }
    ];
  }

  handleCreatePerformanceSuccess(event:IPerformance) {
    this.ref.close(event);
  }

  handleCreatePerformanceFailed() {
    // TODO: show a toast notification saying the request failed
    this.ref.close(null);
  }

  handleFormChange(event:FormGroup) {
    this.buttons[1].disabled = !event.valid
  }
}
