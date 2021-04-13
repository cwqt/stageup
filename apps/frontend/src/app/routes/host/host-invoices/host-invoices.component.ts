import { Component, OnInit, ViewChild } from '@angular/core';
import { capitalize, FilterCode, IEnvelopedData, IHostInvoice, PaymentStatus, TicketType } from '@core/interfaces';
import { prettifyMoney } from '@core/shared/helpers';
import { createICacheable, ICacheable } from '../../../app.interfaces';
import { HostService } from '../../../services/host.service';
import { ToastService } from '../../../services/toast.service';
import { TableComponent } from '../../../ui-lib/table/table.component';
import { IUiTable } from '../../../ui-lib/table/table.interfaces';
import { ThemeKind } from '../../../ui-lib/ui-lib.interfaces';
import { PaymentStatusPipe } from '../../../_pipes/payment-status.pipe';

@Component({
  selector: 'app-host-invoices',
  templateUrl: './host-invoices.component.html',
  styleUrls: ['./host-invoices.component.scss']
})
export class HostInvoicesComponent implements OnInit {
  @ViewChild('table') table: TableComponent<IHostInvoice>;
  tableData: IUiTable<IHostInvoice>;
  invoices: ICacheable<IEnvelopedData<IHostInvoice[]>> = createICacheable([]);

  constructor(private hostService: HostService, private toastService: ToastService) {}

  ngOnInit(): void {
    this.tableData = {
      title: 'Invoices',
      resolver: query => this.hostService.readInvoices(this.hostService.hostId, query),
      selection: {
        multi: true,
        footer_message: v => ({ label: 'Rows Selected:', value: v.selected.length }),
        actions: [
          {
            label: 'Refund selected invoice(s)',
            click: v => console.log(v)
          },
          {
            label: 'Decline refunds',
            click: v => v
          },
          {
            label: 'Download invoice(s)',
            click: v => v
          },
          {
            label: 'Export as CSV',
            click: async v => {
              try {
                await this.hostService.exportInvoicesToCSV(this.hostService.hostId, { invoices: v.selected.map(i => i.invoice_id) });
                this.toastService.emit(
                  'Exported CSVs!\n An e-mail with your attachments will arrive at the e-mail listed on this company account soon',
                  ThemeKind.Primary,
                  { duration: 1e9 }
                );
              } catch (error) {
                this.toastService.emit('An error occured while export to CSV', ThemeKind.Danger, { duration: 5000 });
              }
            }
          }
        ]
      },
      actions: [],
      pagination: { page_sizes: [5, 10, 25] },
      columns: {
        invoice_id: {
          label: 'Invoice ID'
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
          transformer: v => prettifyMoney(v.amount, v.ticket.currency),
          sort: { field: 'amount' },
          filter: {
            type: FilterCode.Number,
            field: 'amount'
          }
        },
        net_amount: {
          label: 'Net Amount',
          // IMPORTANT: Subtracts a random amount off amount for purposes of demo
          // change to actual amount when requirements for tiers/fees are calculated
          transformer: v => prettifyMoney(v.amount - Math.random() * 1000, v.ticket.currency)
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
    };
  }
}