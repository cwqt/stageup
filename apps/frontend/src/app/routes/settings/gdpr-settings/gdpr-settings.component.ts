import { FilterCode } from '@core/interfaces';
import { HelperService } from '@frontend/services/helper.service';
import { MatDialog } from '@angular/material/dialog';
import { OptOutDialogComponent } from '@frontend/components/dialogs/opt-out-dialog/opt-out-dialog.component';
import { UserHostMarketingConsent } from 'libs/shared/src/api/entities/gdpr/consents/user-host-marketing-consent.entity';
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

  constructor(private myselfService: MyselfService, public dialog: MatDialog, private helperService: HelperService) {}

  async ngOnInit(): Promise<void> {
    this.table = new UiTable<UserHostMarketingConsent>({
      resolver: async query => this.myselfService.readUserHostMarketingConsents(query),
      pagination: {
        page_sizes: [5, 10, 25]
      },
      columns: [
        {
          label: $localize`Company`,
          accessor: v => v.host.name,
          sort: { field: 'host_name' }
        }
      ],
      actions: [
        {
          label: $localize`Opt Out`,
          type: 'toggle',

          toggle: {
            primary_label: $localize`Opt In`,
            before_label: $localize`Opt Out`,
            initial_value: v => v.opt_status != 'hard-out',
            event: (e, v) => {
              if (e.checked) {
                // User is opting in.
                this.myselfService.updateOptInStatus(v.host._id, 'hard-in');
              } else {
                // User is opting out.
                // stopPropagation is not possible on mat-slide-toggle, so we need to manually set toggle state back to true until the user has confirmed in the dialog.
                // See https://stackoverflow.com/questions/54005182/mat-slide-toggle-shouldnt-change-its-state-when-i-click-cancel-in-confirmation
                e.source.checked = true;
                this.helperService.showDialog(
                  this.dialog.open(OptOutDialogComponent, {
                    data: { user: v.user, host: v.host }
                  }),
                  () => {
                    // User has confirmed and form is submitted. We can now set the toggle to false.
                    e.source.checked = false;
                  }
                );
              }
            }
          }
        }
      ]
    });
  }
}

// updateLandingPage(event: MatSlideToggleChange) {
//   this.myselfService.updatePreferredLandingPage({ prefers_dashboard_landing: event.checked });
//   this.myself.host_info.prefers_dashboard_landing = event.checked;
// }
