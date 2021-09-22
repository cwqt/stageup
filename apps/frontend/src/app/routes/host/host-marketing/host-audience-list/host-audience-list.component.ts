import { ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
import { ToastService } from '@frontend/services/toast.service';
import { HostService } from 'apps/frontend/src/app/services/host.service';
import { ExportFileType, FilterCode, DtoUserMarketingInfo, IUserMarketingInfo } from '@core/interfaces';
import { UiTable } from '@frontend/ui-lib/table/table.class';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-host-audience-list',
  templateUrl: './host-audience-list.component.html',
  styleUrls: ['./host-audience-list.component.scss']
})
export class HostAudienceListComponent implements OnInit {
  table: UiTable<IUserMarketingInfo>;
  lastUpdated: number;
  constructor(private hostService: HostService, private toastService: ToastService) {}

  ngOnInit(): void {
    this.table = new UiTable<IUserMarketingInfo>({
      resolver: async query => {
        const res = await this.hostService.readHostMarketingConsents(this.hostService.currentHostValue._id, query);
        this.lastUpdated = res.__client_data.last_updated;
        // Table interface requires client data to be null
        return { data: res.data, __paging_data: res.__paging_data, __client_data: null };
      },
      pagination: { page_sizes: [10, 25] },
      selection: {
        multi: true,
        footer_message: v => ({ label: $localize`Rows Selected:`, value: v.selected.length }),
        actions: [
          {
            label: $localize`Export selected as CSV`,
            click: async v => {
              try {
                await this.hostService.exportUserMarketing(
                  this.hostService.hostId,
                  v.selected.map(i => i.__data._id),
                  'csv'
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
          }
        ]
      },
      columns: [
        {
          label: $localize`User`,
          accessor: user => user.name || user.username
        },
        {
          label: $localize`Email Address`,
          accessor: user => user.email_address,
          sort: { field: 'email_address' },
          filter: {
            type: FilterCode.String,
            field: 'email_address'
          }
        }
      ],
      actions: []
    });
  }

  async exportTable(): Promise<void> {
    try {
      await this.hostService.exportUserMarketing(this.hostService.hostId, null, 'csv' as ExportFileType);
      this.toastService.emit(
        $localize`Exported CSV!\n An e-mail with your attachments will arrive at the e-mail listed on this company account shortly`,
        ThemeKind.Primary,
        { duration: 1e9 }
      );
    } catch (error) {
      this.toastService.emit($localize`An error occured while exporting to CSV`, ThemeKind.Danger, {
        duration: 5000
      });
    }
  }
}
