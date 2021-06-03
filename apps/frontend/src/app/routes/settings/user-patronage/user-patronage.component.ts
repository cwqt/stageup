import { Component, LOCALE_ID, OnInit, Inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { i18n, unix } from '@core/helpers';
import { DtoUserPatronageSubscription, FilterCode, IEnvelopedData, PatronSubscriptionStatus } from '@core/interfaces';
import { UiTable } from '@frontend/ui-lib/table/table.class';
import { PatronSubscriptionStatusPipe } from '@frontend/_pipes/patron-subscription-status.pipe';
import { createICacheable, ICacheable } from '../../../app.interfaces';
import { MyselfService } from '../../../services/myself.service';

@Component({
  selector: 'app-user-patronage',
  templateUrl: './user-patronage.component.html',
  styleUrls: ['./user-patronage.component.scss']
})
export class UserPatronageComponent implements OnInit {
  table: UiTable<DtoUserPatronageSubscription>;
  invoices: ICacheable<IEnvelopedData<DtoUserPatronageSubscription[]>> = createICacheable([]);

  constructor(
    @Inject(LOCALE_ID) public locale: string,
    private myselfService: MyselfService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.table = new UiTable<DtoUserPatronageSubscription>(
      {
        resolver: query => this.myselfService.readPatronageSubscriptions(query),
        actions: [],
        pagination: { page_sizes: [10, 25] },
        columns: [
          {
            label: $localize`Subscription ID`,
            accessor: v => v.subscription._id,
            filter: {
              type: FilterCode.String,
              field: 'sub_id'
            }
          },
          {
            label: $localize`Patron Since`,
            accessor: v => i18n.date(unix(v.subscription.created_at), this.locale),
            filter: {
              type: FilterCode.Date,
              field: 'patron_created'
            },
            sort: { field: 'patron_created' }
          },
          {
            label: $localize`Tier`,
            accessor: v => v.subscription.patron_tier.name,
            filter: {
              type: FilterCode.String,
              field: 'tier_name'
            }
          },
          {
            label: $localize`Last Invoice Amount`,
            accessor: v => i18n.money(v.last_invoice.amount, v.last_invoice.currency),
            sort: { field: 'invoice_amount' },
            filter: {
              type: FilterCode.Number,
              field: 'invoice_amount'
            }
          },
          {
            label: $localize`Status`,
            filter: {
              type: FilterCode.Enum,
              field: 'sub_status',
              enum: new Map([
                [PatronSubscriptionStatus.Active, { label: $localize`Active` }],
                [PatronSubscriptionStatus.Cancelled, { label: $localize`Cancelled` }]
              ])
            },
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
