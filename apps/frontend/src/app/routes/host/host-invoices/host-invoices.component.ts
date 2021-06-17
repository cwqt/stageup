import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { capitalize, FilterCode, IEnvelopedData, IHostInvoiceStub, PaymentStatus, TicketType } from '@core/interfaces';
import { i18n } from '@core/helpers';
import { createICacheable, ICacheable } from '@frontend/app.interfaces';
import { InvoiceDialogComponent } from '@frontend/components/dialogs/invoice-dialog/invoice-dialog.component';
import { ProcessRefundsDialogComponent } from '@frontend/components/dialogs/process-refunds-dialog/process-refunds-dialog.component';
import { HelperService } from '@frontend/services/helper.service';
import { HostService } from '@frontend/services/host.service';
import { ToastService } from '@frontend/services/toast.service';
import { UiTable } from '@frontend/ui-lib/table/table.class';
import { ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
import { PaymentStatusPipe } from '@frontend/_pipes/payment-status.pipe';
import { unix } from 'moment';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-host-invoices',
  templateUrl: './host-invoices.component.html',
  styleUrls: ['./host-invoices.component.scss']
})
export class HostInvoicesComponent implements OnInit {
  table: UiTable<IHostInvoiceStub>;
  invoices: ICacheable<IEnvelopedData<IHostInvoiceStub[]>> = createICacheable([]);

  constructor(
    private hostService: HostService,
    private toastService: ToastService,
    public dialog: MatDialog,
    private helperService: HelperService
  ) {}

  ngOnInit(): void {
    this.table = new UiTable<IHostInvoiceStub>(
      {
        title: $localize`Invoices`,
        resolver: query => this.hostService.readInvoices(this.hostService.hostId, query),
        selection: {
          multi: true,
          footer_message: v => ({ label: $localize`Rows Selected:`, value: v.selected.length }),
          actions: [
            {
              label: $localize`Refund selected invoice(s)`,
              click: async v => {
                if (v.selected.some(i => i['__data'].status == PaymentStatus.Refunded)) {
                  this.toastService.emit(
                    $localize`One or more selected invoices have already been refunded`,
                    ThemeKind.Danger,
                    {
                      duration: 5000
                    }
                  );
                  return;
                }

                v.selected.length > 1
                  ? console.log('Bulk refund placeholder for task') // TODO: bulk refund
                  : this.helperService.showDialog(
                      this.dialog.open(ProcessRefundsDialogComponent, { data: v.selected[0].__data })
                    );
              }
            },
            {
              label: $localize`Decline refunds`,
              click: v => v
            },
            {
              label: $localize`Download invoice(s)`,
              click: v => v
            },
            {
              label: $localize`Export as CSV`,
              click: async v => {
                try {
                  await this.hostService.exportInvoicesToCSV(
                    this.hostService.hostId,
                    v.selected.map(i => i.__data.invoice_id)
                  );
                  this.toastService.emit(
                    $localize`Exported CSVs!\n An e-mail with your attachments will arrive at the e-mail listed on this company account shortly`,
                    ThemeKind.Primary,
                    { duration: 1e9 }
                  );
                } catch (error) {
                  this.toastService.emit($localize`An error occured while exporting to CSV`, ThemeKind.Danger, {
                    duration: 5000
                  });
                }
              }
            },
            {
              label: $localize`Export as PDF`,
              click: async v => {
                try {
                  await this.hostService.exportInvoicesToPDF(
                    this.hostService.hostId,
                    v.selected.map(i => i.__data.invoice_id)
                  );
                  this.toastService.emit(
                    $localize`Exported PDFs!\n An e-mail with your attachments will arrive at the e-mail listed on this company account soon`,
                    ThemeKind.Primary,
                    { duration: 1e9 }
                  );
                } catch (error) {
                  this.toastService.emit($localize`An error occured while exporting to PDF`, ThemeKind.Danger, {
                    duration: 5000
                  });
                }
              }
            }
          ]
        },
        actions: [],
        pagination: { page_sizes: [5, 10, 25] },
        columns: [
          {
            label: $localize`Invoice ID`,
            accessor: v => v.invoice_id,
            click_handler: invoice => {
              this.helperService.showDialog(
                this.dialog.open(InvoiceDialogComponent, {
                  data: { invoice, is_host_invoice: true },
                  width: '800px',
                  minHeight: '500px'
                })
              );
            },
            filter: {
              type: FilterCode.String,
              field: 'invoice_id'
            }
          },
          {
            label: $localize`Performance`,
            accessor: v => v.performance.name,
            filter: {
              type: FilterCode.String,
              field: 'performance_name'
            },
            sort: { field: 'performance_name' }
          },
          {
            label: $localize`Ticket`,
            accessor: v => capitalize(v.ticket.type),
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
          {
            label: $localize`Invoice Date`,
            accessor: v => unix(v.invoice_date).format('MMMM Do, YYYY'),
            filter: {
              type: FilterCode.Date,
              field: 'purchased_at'
            },
            sort: { field: 'purchased_at' }
          },
          {
            label: $localize`Amount`,
            accessor: v => i18n.money(v.amount, v.ticket.currency),
            sort: { field: 'amount' },
            filter: {
              type: FilterCode.Number,
              field: 'amount'
            }
          },
          {
            label: $localize`Net Amount`,
            // IMPORTANT: Subtracts a random amount off amount for purposes of demo
            // change to actual amount when requirements for tiers/fees are calculated
            accessor: v => i18n.money(v.amount - Math.random() * 1000, v.ticket.currency)
          },
          {
            label: $localize`Status`,
            accessor: v => new PaymentStatusPipe().transform(v.status),
            filter: {
              field: 'payment_status',
              type: FilterCode.Enum,
              enum: new Map([
                [PaymentStatus.Created, { label: 'Created' }],
                [PaymentStatus.Fufilled, { label: 'Fufilled' }],
                [PaymentStatus.Paid, { label: 'Paid' }],
                [PaymentStatus.RefundDenied, { label: 'Refund Denied' }],
                [PaymentStatus.RefundRequested, { label: 'Refund Pending' }],
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
                case PaymentStatus.RefundRequested:
                  return 'magenta';
                case PaymentStatus.RefundDenied:
                  return 'red';
                case PaymentStatus.Refunded:
                  return 'gray';
              }
            }
          }
        ]
      },
      this.invoices
    );
  }
}
