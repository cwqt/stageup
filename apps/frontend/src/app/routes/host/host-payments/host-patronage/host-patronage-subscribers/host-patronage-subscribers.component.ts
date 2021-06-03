import { Component, Inject, LOCALE_ID, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { i18n, unix } from '@core/helpers';
import { DtoHostPatronageSubscription, FilterCode, PatronSubscriptionStatus } from '@core/interfaces';
import { HostService } from '@frontend/services/host.service';
import { UiTable } from '@frontend/ui-lib/table/table.class';
import { PatronSubscriptionStatusPipe } from '@frontend/_pipes/patron-subscription-status.pipe';

@Component({
  selector: 'app-host-patronage-subscribers',
  templateUrl: './host-patronage-subscribers.component.html',
  styleUrls: ['./host-patronage-subscribers.component.scss']
})
export class HostPatronageSubscribersComponent implements OnInit {
  table: UiTable<DtoHostPatronageSubscription>;

  constructor(@Inject(LOCALE_ID) public locale: string, private hostService: HostService, public dialog: MatDialog) {}

  ngOnInit(): void {
    this.table = new UiTable<DtoHostPatronageSubscription>({
      title: 'Subscribers',
      resolver: query => this.hostService.readPatronageSubscribers(this.hostService.hostId, query),
      selection: {
        multi: true,
        footer_message: v => ({ label: $localize`Rows Selected:`, value: v.selected.length }),
        actions: [
          {
            label: $localize`Export as CSV`,
            click: async v => {} // TODO
          },
          {
            label: $localize`Export as PDF`,
            click: async v => {} // TODO
          }
        ]
      },
      actions: [],
      pagination: { page_sizes: [5, 10, 25] },
      columns: [
        {
          label: $localize`Subscription ID`,
          accessor: v => v.subscription._id,
          filter: {
            type: FilterCode.String,
            field: 'subscription_id'
          }
        },
        {
          label: $localize`User`,
          accessor: v => `@${v.user.username}`,
          filter: {
            type: FilterCode.String,
            field: 'user_username'
          }
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
          label: $localize`Amount`,
          accessor: v => i18n.money(v.last_invoice.amount, v.last_invoice.currency),
          sort: { field: 'invoice_amount' },
          filter: {
            type: FilterCode.Number,
            field: 'invoice_amount'
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
    });
  }
}
