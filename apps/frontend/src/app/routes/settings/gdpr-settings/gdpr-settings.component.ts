import { ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
import { UserHostMarketingConsent } from './../../../../../../../libs/shared/src/api/entities/gdpr/consents/user-host-marketing-consent.entity';
import { MyselfService } from 'apps/frontend/src/app/services/myself.service';
import { UiTable } from '@frontend/ui-lib/table/table.class';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-gdpr-settings',
  templateUrl: './gdpr-settings.component.html',
  styleUrls: ['./gdpr-settings.component.scss']
})
export class GdprSettingsComponent implements OnInit {
  table: UiTable<UserHostMarketingConsent>;

  constructor(private myselfService: MyselfService) {}

  async ngOnInit(): Promise<void> {
    this.table = new UiTable<UserHostMarketingConsent>({
      resolver: async query => this.myselfService.readUserHostMarketingConsents(query),
      pagination: {
        page_sizes: [5, 10, 25]
      },
      columns: [
        {
          label: $localize`Company`,
          accessor: v => v.host.name
        },
        {
          label: $localize`Contact Email`,
          accessor: v => {
            return v.host.email_address;
          }
        },
        {
          label: $localize`Status`,
          accessor: v => {
            switch (v.opt_status) {
              case 'hard-in':
              case 'soft-in':
                return 'Opted In';
              case 'hard-out':
                return 'Opted Out';
            }
          },
          chip_selector: v => {
            switch (v.opt_status) {
              case 'hard-in':
              case 'soft-in':
                return 'green';
              case 'hard-out':
                return 'red';
            }
          }
        }
      ],
      actions: [
        {
          label: $localize`Opt Out`,
          hide: v => v.opt_status == 'hard-out',
          // If the user is specifically clicking to opt out then it is a 'hard-out'
          click: v => {
            this.myselfService.updateOptInStatus(v.host._id, 'hard-out').then(() => this.table.refresh());
          },
          kind: ThemeKind.Danger
        },
        {
          label: $localize`Opt In`,
          hide: v => v.opt_status != 'hard-out',
          // If the user is specifically clicking to opt in then it is a 'hard-in'
          click: v => {
            this.myselfService.updateOptInStatus(v.host._id, 'hard-in').then(() => this.table.refresh());
          }
        }
      ]
    });
  }
}
