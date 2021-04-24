import { Component, EventEmitter, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  calculateAmountFromCurrency,
  capitalize,
  CurrencyCode,
  DonoPeg,
  DONO_PEG_WEIGHT_MAPPING,
  DtoCreateTicket,
  ITicket,
  ITicketStub,
  TicketFees,
  TicketType
} from '@core/interfaces';
import { prettifyMoney, timeless, timestamp } from '@core/helpers';
import { createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { BaseAppService, RouteParam } from 'apps/frontend/src/app/services/app.service';
import { PerformanceService } from 'apps/frontend/src/app/services/performance.service';
import { ToastService } from 'apps/frontend/src/app/services/toast.service';
import { UiDialogButton } from 'apps/frontend/src/app/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { FormComponent } from 'apps/frontend/src/app/ui-lib/form/form.component';
import { UiField, UiForm } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';
import { IUiDialogOptions, ThemeKind } from 'apps/frontend/src/app/ui-lib/ui-lib.interfaces';
import flatten from 'flat';

@Component({
  selector: 'app-create-update-ticket',
  templateUrl: './create-update-ticket.component.html',
  styleUrls: ['./create-update-ticket.component.scss']
})
export class CreateUpdateTicketComponent implements OnInit, IUiDialogOptions {
  @ViewChild('form') form: FormComponent;
  submit: EventEmitter<ITicketStub> = new EventEmitter();
  cancel: EventEmitter<void> = new EventEmitter();

  buttons: UiDialogButton[];
  showDonoPegs: boolean = false;

  ticketForm: UiForm<ITicket, DtoCreateTicket>;
  ticket: ICacheable<ITicket> = createICacheable();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { operation: 'create' | 'update'; ticketId?: string },
    private ref: MatDialogRef<CreateUpdateTicketComponent>,
    private toastService: ToastService,
    private performanceService: PerformanceService,
    private baseAppService: BaseAppService
  ) {}

  ngOnInit(): void {
    this.ticketForm = new UiForm({
      fields: {
        type: UiField.Radio({
          label: 'Ticket type',
          validators: [{ type: 'required' }],
          disabled: this.data.operation == 'update',
          values: new Map([
            [TicketType.Paid, { label: 'Paid' }],
            [TicketType.Free, { label: 'Free' }],
            [TicketType.Donation, { label: 'Donation' }]
          ])
        }),
        name: UiField.Text({
          label: 'Ticket title',
          validators: [{ type: 'required' }]
        }),
        dono_pegs: UiField.Container({
          header_level: 0,
          label: 'Select Donation Amounts:',
          hide: fg => fg.getRawValue()['type'] !== TicketType.Donation,
          fields: Object.entries(DONO_PEG_WEIGHT_MAPPING).reduce((acc, curr) => {
            const [peg, weight] = curr;
            acc[peg] = UiField.Checkbox({
              width: 4,
              label:
                peg == 'allow_any'
                  ? 'Allow Any'
                  : prettifyMoney(calculateAmountFromCurrency(CurrencyCode.GBP, weight), CurrencyCode.GBP)
            });

            return acc;
          }, {})
        }),
        amount: UiField.Number({
          width: 6,
          label: 'Price',
          disabled: false,
          validators: [{ type: 'maxlength', value: 100 }]
        }),
        quantity: UiField.Number({
          width: 6,
          label: 'Quantity',
          validators: [{ type: 'required' }]
        }),
        fees: UiField.Select({
          label: 'Fees',
          validators: [{ type: 'required' }],
          values: new Map([
            [TicketFees.Absorb, { label: 'Absorb Fees' }],
            [TicketFees.PassOntoPurchaser, { label: 'Pass onto Purchaser' }]
          ])
        }),
        sales_starts: UiField.Container({
          header_level: 0,
          label: 'Sales starts',
          fields: {
            date: UiField.Date({
              width: 6,
              label: 'Date',
              min_date: new Date(timestamp() * 1000),
              validators: [{ type: 'required' }]
            }),
            time: UiField.Time({
              width: 6,
              label: 'Time',
              validators: [{ type: 'required' }],
              initial: 0
            })
          }
        }),
        sales_end: UiField.Container({
          label: 'Sales end',
          header_level: 0,
          fields: {
            date: UiField.Date({
              width: 6,
              label: 'Date',
              min_date: new Date(timestamp() * 1000),
              validators: [{ type: 'required' }]
            }),
            time: UiField.Time({
              width: 6,
              label: 'Time',
              validators: [{ type: 'required' }],
              initial: 0
            })
          }
        }),
        visibility: UiField.Container({
          label: 'Ticket Visibility',
          header_level: 0,
          fields: {
            value: UiField.Checkbox({
              initial: false,
              label: 'Hide this ticket type'
            })
          }
        })
      },
      resolvers: {
        input: async () => {
          if (this.data.operation == 'update') {
            const data = await this.performanceService.readTicket(
              this.baseAppService.getParam(RouteParam.PerformanceId),
              this.data.ticketId
            );

            // flatten will make fields for this --> dono.0, dono.1, which we don't want
            if (data.type !== 'dono') delete data.dono_pegs;

            const fields = flatten(data);

            const startDate = timeless(new Date(data.start_datetime * 1000));
            const startTime = data.start_datetime - startDate.getTime() / 1000;
            fields['sales_starts.date'] = startDate;
            fields['sales_starts.time'] = startTime;

            const endDate = timeless(new Date(data.end_datetime * 1000));
            const endTime = data.end_datetime - endDate.getTime() / 1000;
            fields['sales_end.date'] = endDate;
            fields['sales_end.time'] = endTime;

            // Convert back into pounds from pence
            fields['amount'] = data.amount / 100;
            fields['visibility.value'] = !data.is_visible;

            // Set the pegs up
            if (data.type == 'dono') data.dono_pegs.forEach(peg => (fields[`dono_pegs.${peg}`] = true));

            return {
              fields: fields
            };
          }
        },
        output: async v =>
          this.data.operation == 'create'
            ? this.performanceService.createTicket(
                this.baseAppService.getParam(RouteParam.PerformanceId),
                this.formOutputTransformer(v)
              )
            : this.performanceService.updateTicket(
                this.baseAppService.getParam(RouteParam.PerformanceId),
                this.data.ticketId,
                this.formOutputTransformer(v)
              )
      },
      handlers: {
        success: async ticket => {
          this.toastService.emit(`${capitalize(this.data.operation)}d ticket: ${ticket.name}!`);
          this.submit.emit(ticket);
          this.ref.close(ticket);
        },
        failure: async () => this.ref.close(null),
        changes: async f => {
          if (f.value.type == TicketType.Free || f.value.type == TicketType.Donation) {
            f.controls.amount.disable({ emitEvent: false, onlySelf: true });
          } else {
            f.controls.amount.enable({ emitEvent: false, onlySelf: true });
          }
        }
      }
    });

    this.buttons = [
      new UiDialogButton({
        label: 'Cancel',
        kind: ThemeKind.Secondary,
        callback: () => this.ref.close()
      }),
      new UiDialogButton({
        label: capitalize(this.data.operation),
        kind: ThemeKind.Primary,
        callback: () => this.ticketForm.submit()
      }).attach(this.ticketForm)
    ];
  }

  formOutputTransformer(v): DtoCreateTicket {
    return {
      name: v.name,
      currency: CurrencyCode.GBP,
      amount: v.type == TicketType.Free ? 0 : v.amount * 100, // TODO: support more than pence
      type: v.type,
      quantity: v.quantity,
      fees: v.fees,
      start_datetime: new Date(v.sales_starts.date).getTime() / 1000 + v.sales_starts.time,
      end_datetime: new Date(v.sales_end.date).getTime() / 1000 + v.sales_end.time,
      is_visible: !v.visibility.value,
      is_quantity_visible: true,
      // filter array into only selected DonoPegs
      dono_pegs: Object.keys(v.dono_pegs)
        .filter(peg => v.dono_pegs[peg] == true)
        .map(peg => peg as DonoPeg)
    };
  }
}
