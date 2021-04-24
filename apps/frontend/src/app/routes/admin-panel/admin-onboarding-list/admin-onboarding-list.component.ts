import { Component, Host, OnInit, ViewChild } from '@angular/core';
import { FilterCode, HostOnboardingState, IEnvelopedData, IHostOnboarding } from '@core/interfaces';
import { AdminService } from 'apps/frontend/src/app/services/admin.service';
import { createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';
import { IUiTable } from '../../../ui-lib/table/table.interfaces';
import { TableComponent } from '../../../ui-lib/table/table.component';
import { OnboardingStatePipe } from '../../../_pipes/object-state.pipe';
import { enumToValues } from '@core/helpers';

@Component({
  selector: 'app-admin-onboarding-list',
  templateUrl: './admin-onboarding-list.component.html',
  styleUrls: ['./admin-onboarding-list.component.scss']
})
export class AdminOnboardingListComponent implements OnInit {
  @ViewChild('table') table: TableComponent<IHostOnboarding>;
  tableData: IUiTable<IHostOnboarding>;
  onboardings: ICacheable<IEnvelopedData<IHostOnboarding[]>> = createICacheable([]);

  constructor(private adminService: AdminService, private appService: BaseAppService) {}

  ngOnInit() {
    this.tableData = {
      title: 'Onboardings',
      resolver: query => this.adminService.readOnboardingProcesses(query),
      selection: {
        multi: true,
        actions: [
          {
            label: 'log',
            click: v => console.log(v)
          }
        ]
      },
      pagination: {
        page_sizes: [5, 10, 25]
      },
      actions: [
        {
          label: 'Open',
          icon: 'launch',
          click: v => this.openOnboarding(v)
        }
      ],
      columns: {
        state: {
          label: 'State',
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
          transformer: v => new OnboardingStatePipe().transform(v.state),
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
        host: {
          label: 'Host',
          transformer: v => `@${v.host.username}`,
          filter: { type: FilterCode.String, field: 'username' }
        },
        last_submitted: {
          sort: { field: 'last_submitted' },
          filter: { type: FilterCode.Date, field: 'last_submitted' },
          label: 'Last Submitted',
          transformer: v => (v.last_submitted ? new Date(v.last_submitted * 1000).toISOString() : 'Never')
        }
      }
    };
  }

  openOnboarding(onboarding: IHostOnboarding) {
    this.appService.navigateTo(`/admin/onboardings/${onboarding.host._id}`);
  }
}
