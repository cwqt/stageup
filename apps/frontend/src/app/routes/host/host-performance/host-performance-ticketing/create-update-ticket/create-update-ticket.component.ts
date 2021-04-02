import { Component, EventEmitter, Inject, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { capitalize, CurrencyCode, DtoCreateTicket, ITicket, ITicketStub, TicketFees, TicketType } from '@core/interfaces';
import { createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { BaseAppService, RouteParam } from 'apps/frontend/src/app/services/app.service';
import { PerformanceService } from 'apps/frontend/src/app/services/performance.service';
import { ToastService } from 'apps/frontend/src/app/services/toast.service';
import { FormComponent } from 'apps/frontend/src/app/ui-lib/form/form.component';
import { IUiForm, IUiFormPrefetchData } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';
import { IUiDialogOptions, ThemeKind } from 'apps/frontend/src/app/ui-lib/ui-lib.interfaces';
import flatten from 'flat';
import { timeless } from '@core/shared/helpers';

@Component({
  selector: 'app-create-update-ticket',
  templateUrl: './create-update-ticket.component.html',
  styleUrls: ['./create-update-ticket.component.scss']
})
export class CreateUpdateTicketComponent implements OnInit, IUiDialogOptions {
  @ViewChild('form') form: FormComponent;
  submit: EventEmitter<ITicketStub> = new EventEmitter();
  cancel: EventEmitter<void> = new EventEmitter();
  buttons: IUiDialogOptions['buttons'] = [];

  ticketForm: IUiForm<ITicket>;
  ticket: ICacheable<ITicket> = createICacheable();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { operation: 'create' | 'update'; ticketId?: string },
    private ref: MatDialogRef<CreateUpdateTicketComponent>,
    private toastService: ToastService,
    private performanceService: PerformanceService,
    private baseAppService: BaseAppService
  ) {}

  ngOnInit(): void {
    this.ticketForm = {
      prefetch: async () => {
        if (this.data.operation == 'update') {
          const data = await this.performanceService.readTicket(
            this.baseAppService.getParam(RouteParam.PerformanceId),
            this.data.ticketId
          );

          const fields = flatten<any, IUiFormPrefetchData['fields']>(data);

          const startDate = timeless(new Date(data.start_datetime * 1000));
          const startTime = data.start_datetime - (startDate.getTime() / 1000);
          fields["sales_starts.date"] = startDate as unknown as string;
          fields["sales_starts.time"] = startTime as unknown as string;

          const endDate = timeless(new Date(data.end_datetime * 1000));
          const endTime = data.end_datetime - (endDate.getTime() / 1000);
          fields["sales_end.date"] = endDate as unknown as string;
          fields["sales_end.time"] = endTime as unknown as string;

          // Convert back into pounds from pence
          fields["amount"] = (data.amount / 100) as unknown as string;
          
          fields["visibility.value"] = !data.is_visible as unknown as string;
          
          return {
            fields: fields
          };
        }
      },
      fields: {
        type: {
          type: 'radio',
          label: 'Ticket type',
          validators: [{ type: 'required' }],
          disabled: this.data.operation == "update",
          options: {
            values: new Map([
              [TicketType.Paid, { label: 'Paid' }],
              [TicketType.Free, { label: 'Free' }],
              [TicketType.Donation, { label: 'Donation' }]
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
              [TicketFees.Absorb, { label: 'Absorb Fees' }],
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
        text: capitalize(this.data.operation),
        variant: 'primary',
        handler: async v =>
          this.data.operation == 'create'
            ? this.performanceService.createTicket(this.baseAppService.getParam(RouteParam.PerformanceId), v)
            : this.performanceService.updateTicket(
                this.baseAppService.getParam(RouteParam.PerformanceId),
                this.data.ticketId,
                v
              ),
        transformer: (v): DtoCreateTicket => ({
          name: v.name,
          currency: CurrencyCode.GBP,
          amount: v.type == TicketType.Free ? 0 : v.amount * 100, // TODO: support more than pence
          type: v.type,
          quantity: v.quantity,
          fees: v.fees,
          start_datetime: new Date(v.sales_starts.date).getTime() / 1000 + v.sales_starts.time,
          end_datetime: new Date(v.sales_end.date).getTime() / 1000 + v.sales_end.time,
          is_visible: !v.visibility.value
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
        text: capitalize(this.data.operation),
        kind: ThemeKind.Primary,
        disabled: true,
        callback: () => this.form.onSubmit()
      }
    ];
  }

  handleFormSuccess(event: ITicket) {
    this.toastService.emit(`${capitalize(this.data.operation)}d ticket: ${event.name}!`);
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
