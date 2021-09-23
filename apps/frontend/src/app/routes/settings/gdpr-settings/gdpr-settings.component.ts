import { ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
import { ToastService } from '@frontend/services/toast.service';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { HelperService } from '@frontend/services/helper.service';
import { MatDialog } from '@angular/material/dialog';
import { OptOutDialogComponent } from '@frontend/components/dialogs/opt-out-dialog/opt-out-dialog.component';
import { MyselfService } from 'apps/frontend/src/app/services/myself.service';
import { UiTable } from '@frontend/ui-lib/table/table.class';
import { Component, OnInit } from '@angular/core';
import { IUserHostMarketingConsent, IMyself } from '@core/interfaces';

@Component({
  selector: 'app-gdpr-settings',
  templateUrl: './gdpr-settings.component.html',
  styleUrls: ['./gdpr-settings.component.scss']
})
export class GdprSettingsComponent implements OnInit {
  myself: IMyself;

  table: UiTable<IUserHostMarketingConsent>;

  userDeclinesPlatformMarketing: boolean;

  constructor(
    private myselfService: MyselfService,
    public dialog: MatDialog,
    private helperService: HelperService,
    private toastService: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    this.myself = this.myselfService.$myself.getValue();
    this.table = new UiTable<IUserHostMarketingConsent>({
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
            after_label: $localize`Opt In`,
            before_label: $localize`Opt Out`,
            initial_value: v => v.opt_status != 'hard-out',
            event: (e, v) => {
              if (e.checked) {
                // User is opting in.
                this.myselfService.updateHostOptInStatus(v.host._id, 'hard-in');
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

    const platformMarketingOptStatus = await this.myselfService.readUserPlatformMarketingConsent();
    // platform marketing is either 'hard-in' or 'hard-out'. If not yet consented, the default of the toggle will be false.
    this.userDeclinesPlatformMarketing = platformMarketingOptStatus == 'hard-out';
  }

  async toggleFutureHostMarketingPrompts(event: MatSlideToggleChange): Promise<void> {
    try {
      await this.myselfService.updateShowHostMarketingPrompts(event.checked);
      // Update the `$myself` BehaviourSubject
      this.myselfService.setUser({
        ...this.myselfService.$myself.getValue().user,
        is_hiding_host_marketing_prompts: event.checked
      });
      this.myself.user.is_hiding_host_marketing_prompts = event.checked;
    } catch (error) {
      this.toastService.emit($localize`An error occured while updating your preference`, ThemeKind.Danger, {
        duration: 5000
      });
    }
  }

  async togglePlatformMarketing(event: MatSlideToggleChange): Promise<void> {
    try {
      const optStatus = event.checked ? 'hard-out' : 'hard-in';
      await this.myselfService.updatePlatformMarketingConsent(optStatus);
    } catch (error) {
      this.toastService.emit($localize`An error occured while updating your preference`, ThemeKind.Danger, {
        duration: 5000
      });
    }
  }
}
