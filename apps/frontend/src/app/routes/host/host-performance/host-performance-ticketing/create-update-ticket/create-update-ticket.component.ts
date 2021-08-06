import { Component, EventEmitter, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  calculateAmountFromCurrency,
  capitalize,
  CurrencyCode,
  DonoPeg,
  DONO_PEG_WEIGHT_MAPPING,
  DtoCreateTicket,
  IHost,
  ITicket,
  ITicketStub,
  TicketFees,
  TicketType
} from '@core/interfaces';
import { i18n, timeless, timestamp } from '@core/helpers';
import { createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { AppService, RouteParam } from 'apps/frontend/src/app/services/app.service';
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
  host: IHost;

  buttons: UiDialogButton[];
  showDonoPegs: boolean = false;

  ticketForm: UiForm<ITicket, DtoCreateTicket>;
  ticket: ICacheable<ITicket> = createICacheable();
  dialogTitle: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { operation: 'create' | 'update'; ticketId?: string; host: IHost },
    private ref: MatDialogRef<CreateUpdateTicketComponent>,
    private toastService: ToastService,
    private performanceService: PerformanceService,
    private appService: AppService
  ) {}

  ngOnInit(): void {
    this.host = this.data.host;
    this.dialogTitle = this.data.operation == 'update' ? $localize`Update ticket` : $localize`Create ticket`;

    this.ticketForm = new UiForm({
      fields: {
        type: UiField.Radio({
          label: $localize`Ticket type`,
          validators: [{ type: 'required' }],
          disabled: this.data.operation == 'update',
          initial: this.host.stripe_account_id ? TicketType.Paid : TicketType.Free,
          values: new Map([
            [TicketType.Paid, { label: $localize`Paid`, disabled: !this.host.stripe_account_id }],
            [TicketType.Free, { label: $localize`Free` }],
            [TicketType.Donation, { label: $localize`Donation`, disabled: !this.host.stripe_account_id }]
          ])
        }),
        name: UiField.Text({
          label: $localize`Ticket title`,
          validators: [{ type: 'required' }, { type: 'maxlength', value: 64 }]
        }),
        dono_pegs: UiField.Container({
          header_level: 0,
          label: $localize`Select Donation Amounts:`,
          hide: fg => fg.getRawValue()['type'] !== TicketType.Donation,
          fields: Object.entries(DONO_PEG_WEIGHT_MAPPING).reduce((acc, curr) => {
            const [peg, weight] = curr;
            acc[peg] = UiField.Checkbox({
              width: 4,
              label:
                peg == 'allow_any'
                  ? $localize`Allow Any`
                  : i18n.money(calculateAmountFromCurrency(CurrencyCode.GBP, weight), CurrencyCode.GBP)
            });

            return acc;
          }, {})
        }),
        amount: UiField.Money({
          width: 6,
          label: $localize`Price`,
          currency: CurrencyCode.GBP,
          disabled: false,
          validators: [{ type: 'maxlength', value: 100 }, { type: 'required' }]
        }),
        quantity: UiField.Number({
          width: 6,
          label: $localize`Quantity`,
          validators: [{ type: 'required' }]
        }),
        fees: UiField.Select({
          label: $localize`Fees`,
          validators: [{ type: 'required' }],
          values: new Map([
            [TicketFees.Absorb, { label: $localize`Absorb Fees` }],
            [TicketFees.PassOntoPurchaser, { label: $localize`Pass onto Purchaser` }]
          ])
        }),
        start_datetime: UiField.Datetime({
          width: 6,
          label: $localize`Sales start`,
          min_date: new Date(timestamp() * 1000),
          validators: [{ type: 'required' }]
        }),
        end_datetime: UiField.Datetime({
          width: 6,
          label: $localize`Sales end`,
          min_date: new Date(timestamp() * 1000),
          validators: [{ type: 'required' }]
        }),
        visibility: UiField.Container({
          label: $localize`Ticket Visibility`,
          header_level: 0,
          fields: {
            value: UiField.Checkbox({
              initial: false,
              label: $localize`Hide this ticket type`
            })
          }
        })
      },
      resolvers: {
        input: async () => {
          if (this.data.operation == 'update') {
            const data = await this.performanceService.readTicket(
              this.appService.getParam(RouteParam.PerformanceId),
              this.data.ticketId
            );

            // flatten will make fields for this --> dono.0, dono.1, which we don't want
            if (data.type !== 'dono') delete data.dono_pegs;

            const fields = flatten(data);

            const startDate = timeless(new Date(data.start_datetime * 1000));
            const startTime = data.start_datetime - startDate.getTime() / 1000;
            fields['start_datetime.date'] = startDate;
            fields['start_datetime.time'] = startTime;

            const endDate = timeless(new Date(data.end_datetime * 1000));
            const endTime = data.end_datetime - endDate.getTime() / 1000;
            fields['end_datetime.date'] = endDate;
            fields['end_datetime.time'] = endTime;

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
                this.appService.getParam(RouteParam.PerformanceId),
                this.formOutputTransformer(v)
              )
            : this.performanceService.updateTicket(
                this.appService.getParam(RouteParam.PerformanceId),
                this.data.ticketId,
                this.formOutputTransformer(v)
              )
      },
      handlers: {
        success: async ticket => {
          this.toastService.emit(
            this.data.operation == 'update'
              ? $localize`Updated ticket: ${ticket.name}!`
              : $localize`Created ticket: ${ticket.name}!`
          );
          this.submit.emit(ticket);
          this.ref.close(ticket);
        },
        failure: async () => {},
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
        label: $localize`Cancel`,
        kind: ThemeKind.Secondary,
        callback: () => this.ref.close()
      }),
      new UiDialogButton({
        label: this.data.operation == 'update' ? $localize`Update` : $localize`Create`,
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
      start_datetime: Math.floor(v.start_datetime.getTime() / 1000),
      end_datetime: Math.floor(v.end_datetime.getTime() / 1000),
      is_visible: !v.visibility.value,
      is_quantity_visible: true,
      // filter array into only selected DonoPegs
      dono_pegs: Object.keys(v.dono_pegs)
        .filter(peg => v.dono_pegs[peg] == true)
        .map(peg => peg as DonoPeg)
    };
  }
}
