import { Component, OnInit } from '@angular/core';
import { enumToValues } from '@core/helpers';
import { FilterCode, HostOnboardingState, IHostOnboarding } from '@core/interfaces';
import { UiTable } from '@frontend/ui-lib/table/table.class';
import { AdminService } from 'apps/frontend/src/app/services/admin.service';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';
import { OnboardingStatePipe } from '../../../_pipes/onboarding-state.pipe';

@Component({
  selector: 'app-admin-onboarding-list',
  templateUrl: './admin-onboarding-list.component.html',
  styleUrls: ['./admin-onboarding-list.component.scss']
})
export class AdminOnboardingListComponent implements OnInit {
  table: UiTable<IHostOnboarding>;

  constructor(private adminService: AdminService, private appService: BaseAppService) {}

  ngOnInit() {
    this.table = new UiTable<IHostOnboarding>({
      title: $localize`:@@admin_onboardings_list_onboardings:Onboardings`,
      resolver: query => this.adminService.readOnboardingProcesses(query),
      selection: {
        multi: true,
        actions: []
      },
      pagination: {
        page_sizes: [5, 10, 25]
      },
      actions: [
        {
          label: $localize`:@@admin_onboardings_list_open:Open`,
          icon: 'launch',
          click: v => this.openOnboarding(v)
        }
      ],
      columns: [
        {
          label: $localize`:@@admin_onboardings_list_state:State`,
          filter: {
            type: FilterCode.Enum,
            field: 'state',
            enum: new Map(
              enumToValues(HostOnboardingState, true).reduce(
                (acc, curr) => {
                  acc.values.push([curr, { label: acc.pipe.transform(curr) }]);
                  return acc;
                },
                { values: [], pipe: new OnboardingStatePipe() }
              ).values
            )
          },
          accessor: v => new OnboardingStatePipe().transform(v.state),
          chip_selector: v => {
            switch (v.state) {
              case HostOnboardingState.AwaitingChanges:
                return 'magenta';
              case HostOnboardingState.Enacted:
                return 'green';
              case HostOnboardingState.PendingVerification:
                return 'blue';
              case HostOnboardingState.Verified:
                return 'cool-grey';
              case HostOnboardingState.Modified:
                return 'magenta';
              case HostOnboardingState.HasIssues:
                return 'red';
            }
          }
        },
        {
          label: $localize`:@@admin_onboardings_list_host:Host`,
          accessor: v => `@${v.host.username}`,
          filter: { type: FilterCode.String, field: 'username' }
        },
        {
          sort: { field: 'last_submitted' },
          filter: { type: FilterCode.Date, field: 'last_submitted' },
          label: $localize`:@@admin_onboardings_list_last_submitted:Last Submitted`,
          accessor: v =>
            v.last_submitted
              ? new Date(v.last_submitted * 1000).toISOString()
              : $localize`:@@admin_onboardings_list_never:Never`
        }
      ]
    });
  }

  openOnboarding(onboarding: IHostOnboarding) {
    this.appService.navigateTo(`/admin/onboardings/${onboarding.host._id}`);
  }
}
