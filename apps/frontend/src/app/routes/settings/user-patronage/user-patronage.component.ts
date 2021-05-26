import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { prettifyMoney } from '@core/helpers';
import {
  capitalize,
  DtoUserPatronageInvoice,
  FilterCode,
  IEnvelopedData,
  IUserInvoice,
  PaymentStatus,
  PatronSubscriptionStatus,
  TicketType
} from '@core/interfaces';
import { InvoiceDialogComponent } from '@frontend/components/dialogs/invoice-dialog/invoice-dialog.component';
import { UiTable } from '@frontend/ui-lib/table/table.class';
import { PatronSubscriptionStatusPipe } from '@frontend/_pipes/patron-subscription-status.pipe';
import { createICacheable, ICacheable } from '../../../app.interfaces';
import { MyselfService } from '../../../services/myself.service';
import { PaymentStatusPipe } from '../../../_pipes/payment-status.pipe';

@Component({
  selector: 'app-user-patronage',
  templateUrl: './user-patronage.component.html',
  styleUrls: ['./user-patronage.component.scss']
})
export class UserPatronageComponent implements OnInit {
  table: UiTable<DtoUserPatronageInvoice>;
  invoices: ICacheable<IEnvelopedData<DtoUserPatronageInvoice[]>> = createICacheable([]);

  constructor(private myselfService: MyselfService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.table = new UiTable<DtoUserPatronageInvoice>(
      {
        resolver: query => this.myselfService.readPatronageSubscriptions(query),
        actions: [],
        pagination: { page_sizes: [10, 25] },
        columns: [
          {
            label: 'Subscription ID',
            accessor: v => v.subscription._id
          },
          {
            label: 'Patron Since',
            accessor: v => new Date(v.subscription.created_at * 1000).toISOString(),
            filter: {
              type: FilterCode.Date,
              field: 'purchased_at'
            },
            sort: { field: 'purchased_at' }
          },
          {
            label: 'Tier',
            accessor: v => v.subscription.patron_tier.name
          },
          {
            label: 'Amount',
            accessor: v => prettifyMoney(v.amount, v.currency),
            sort: { field: 'amount' },
            filter: {
              type: FilterCode.Number,
              field: 'amount'
            }
          },
          {
            label: 'Status',
            accessor: v => new PatronSubscriptionStatusPipe().transform(v.subscription.status),
            chip_selector: v => {
              switch (v.subscription.status) {
                case PatronSubscriptionStatus.Active:
                  return 'green';
                case PatronSubscriptionStatus.Cancelled:
                  return 'red';
              }
            }
          }
        ]
      },
      this.invoices
    );
  }
}
