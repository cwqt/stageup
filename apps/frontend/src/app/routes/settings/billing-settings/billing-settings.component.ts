import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { prettifyMoney } from '@core/helpers';
import { capitalize, FilterCode, IEnvelopedData, IUserInvoice, PaymentStatus, TicketType } from '@core/interfaces';
import { InvoiceDialogComponent } from '@frontend/components/dialogs/invoice-dialog/invoice-dialog.component';
import { UiTable } from '@frontend/ui-lib/table/table.class';
import { createICacheable, ICacheable } from '../../../app.interfaces';
import { MyselfService } from '../../../services/myself.service';
import { PaymentStatusPipe } from '../../../_pipes/payment-status.pipe';

@Component({
  selector: 'app-billing-settings',
  templateUrl: './billing-settings.component.html',
  styleUrls: ['./billing-settings.component.scss']
})
export class BillingSettingsComponent implements OnInit {
  table: UiTable<IUserInvoice>;
  invoices: ICacheable<IEnvelopedData<IUserInvoice[]>> = createICacheable([]);

  constructor(private myselfService: MyselfService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.table = new UiTable<IUserInvoice>(
      {
        resolver: query => this.myselfService.readInvoices(query),
        actions: [],
        pagination: { page_sizes: [10, 25] },
        columns: {
          invoice_id: {
            label: 'Invoice ID',
            click_handler: invoice =>
              this.dialog.open(InvoiceDialogComponent, { data: { invoice, is_host_invoice: false } })
          },
          performance: {
            label: 'Performance',
            transformer: v => v.performance.name,
            filter: {
              type: FilterCode.String,
              field: 'performance_name'
            },
            sort: { field: 'performance_name' }
          },
          ticket: {
            label: 'Ticket',
            transformer: v => capitalize(v.ticket.type),
            filter: {
              type: FilterCode.Enum,
              field: 'ticket_type',
              enum: new Map([
                [TicketType.Paid, { label: 'Paid' }],
                [TicketType.Donation, { label: 'Donation' }],
                [TicketType.Free, { label: 'Free' }]
              ])
            },
            chip_selector: v => {
              switch (v.ticket.type) {
                case TicketType.Paid:
                  return 'purple';
                case TicketType.Donation:
                  return 'blue';
                case TicketType.Free:
                  return 'green';
              }
            }
          },
          invoice_date: {
            label: 'Invoice Date',
            transformer: v => new Date(v.invoice_date * 1000).toISOString(),
            filter: {
              type: FilterCode.Date,
              field: 'purchased_at'
            },
            sort: { field: 'purchased_at' }
          },
          amount: {
            label: 'Amount',
            transformer: v => prettifyMoney(v.amount, v.currency),
            sort: { field: 'amount' },
            filter: {
              type: FilterCode.Number,
              field: 'amount'
            }
          },
          status: {
            label: 'Status',
            transformer: v => new PaymentStatusPipe().transform(v.status),
            filter: {
              field: 'payment_status',
              type: FilterCode.Enum,
              enum: new Map([
                [PaymentStatus.Created, { label: 'Created' }],
                [PaymentStatus.Fufilled, { label: 'Fufilled' }],
                [PaymentStatus.Paid, { label: 'Paid' }],
                [PaymentStatus.RefundDenied, { label: 'Refund Denied' }],
                [PaymentStatus.RefundPending, { label: 'Refund Pending' }],
                [PaymentStatus.Refunded, { label: 'Refunded' }]
              ])
            },
            chip_selector: v => {
              switch (v.status) {
                case PaymentStatus.Created:
                  return 'blue';
                case PaymentStatus.Fufilled:
                  return 'gray';
                case PaymentStatus.Paid:
                  return 'green';
                case PaymentStatus.RefundPending:
                  return 'magenta';
                case PaymentStatus.RefundDenied:
                  return 'red';
                case PaymentStatus.Refunded:
                  return 'gray';
              }
            }
          }
        }
      },
      this.invoices
    );
  }
}
