import { Component, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import {
  CurrencyCode,
  DtoCreateTicket,
  ITicket,
  ITicketStub,
  TicketFees,
  TicketType
} from '@core/interfaces';
import { createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { BaseAppService, RouteParam } from 'apps/frontend/src/app/services/app.service';
import { PerformanceService } from 'apps/frontend/src/app/services/performance.service';
import { ToastService } from 'apps/frontend/src/app/services/toast.service';
import { FormComponent } from 'apps/frontend/src/app/ui-lib/form/form.component';
import { IUiForm } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';
import { IUiDialogOptions, ThemeKind } from 'apps/frontend/src/app/ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-create-ticket',
  templateUrl: './create-ticket.component.html',
  styleUrls: ['./create-ticket.component.scss']
})
export class CreateTicketComponent implements OnInit, IUiDialogOptions {
  @ViewChild('form') form: FormComponent;
  submit: EventEmitter<ITicketStub> = new EventEmitter();
  cancel: EventEmitter<void> = new EventEmitter();
  buttons: IUiDialogOptions['buttons'] = [];

  createTicketForm: IUiForm<ITicket>;
  ticket: ICacheable<ITicket> = createICacheable();

  constructor(
    private ref: MatDialogRef<CreateTicketComponent>,
    private toastService: ToastService,
    private performanceService: PerformanceService,
    private baseAppService: BaseAppService
  ) {}

  ngOnInit(): void {
    this.createTicketForm = {
      fields: {
        type: {
          type: 'radio',
          label: 'Ticket type',
          validators: [{ type: 'required' }],
          options: {
            values: new Map([
              [TicketType.Paid, { label: "Paid"}],
              [TicketType.Free, { label: "Free"}],
              [TicketType.Donation, { label: "Donation"}],
            ])
          }
        },
        name: {
          type: 'text',
          label: 'Ticket title',
          validators: [{ type: 'required' }]
        },
        amount: {
          width: 6,
          type: 'number',
          label: 'Price',
          disabled: false,
          validators: [{ type: 'maxlength', value: 100 }]
        },
        quantity: {
          width: 6,
          type: 'number',
          label: 'Quantity',
          validators: [{ type: 'required' }]
        },
        fees: {
          type: 'select',
          label: 'Fees',
          validators: [{ type: 'required' }],
          options: {
            values: new Map([
              [TicketFees.Absorb, { label: 'Absord Fees' }],
              [TicketFees.PassOntoPurchaser, { label: 'Pass onto Purchaser' }]
            ])
          }
        },
        sales_starts: {
          type: 'container',
          options: {
            header_level: 0
          },
          label: 'Sales starts',
          fields: {
            date: {
              width: 6,
              type: 'date',
              label: 'Date',
              validators: [{ type: 'required' }]
            },
            time: {
              width: 6,
              type: 'time',
              label: 'Time',
              validators: [{ type: 'required' }]
            }
          }
        },
        sales_end: {
          type: 'container',
          label: 'Sales starts',
          options: {
            header_level: 0
          },
          fields: {
            date: {
              width: 6,
              type: 'date',
              label: 'Date',
              validators: [{ type: 'required' }]
            },
            time: {
              width: 6,
              type: 'time',
              label: 'Time',
              validators: [{ type: 'required' }]
            }
          }
        },
        visibility: {
          type: 'container',
          label: 'Ticket Visibility',
          options: {
            header_level: 0
          },
          fields: {
            value: {
              initial: false,
              type: 'checkbox',
              label: 'Hide this ticket type'
            }
          }
        }
      },
      submit: {
        is_hidden: true,
        text: 'Create',
        variant: 'primary',
        handler: async v =>
          this.performanceService.createTicket(this.baseAppService.getParam(RouteParam.PerformanceId), v),
        transformer: (v): DtoCreateTicket => ({
          name: v.name,
          currency: CurrencyCode.GBP,
          amount: v.type == TicketType.Free ? 0 : v.amount * 100, // TODO: support more than pence
          type: v.type,
          quantity: v.quantity,
          fees: v.fees,
          start_datetime: new Date(v.sales_starts.date).getTime() / 1000 + v.sales_starts.time,
          end_datetime: new Date(v.sales_end.date).getTime() / 1000 + v.sales_end.time,
          is_visible: v.visibility.value
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

  handleFormSuccess(event: ITicket) {
    this.toastService.emit(`Created ticket: ${event.name}!`);
    this.submit.emit(event);
    this.ref.close(event);
  }

  handleFormFailure() {
    this.ref.close(null);
  }

  handleFormChange(event: FormGroup) {
    this.buttons[1].disabled = !event.valid;
    if (event.value.type == TicketType.Free) {
      event.controls.amount.disable({ emitEvent: false, onlySelf: true });
    } else {
      event.controls.amount.enable({ emitEvent: false, onlySelf: true });
    }
  }
}
