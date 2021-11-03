import { HostPermissionPipe } from './../../../_pipes/host-permission.pipe';
import { UiTable } from '@frontend/ui-lib/table/table.class';
import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IUserHostInfo } from '@core/interfaces';
import { HelperService } from '../../../services/helper.service';
import { HostService } from '../../../services/host.service';
import { HostAddMemberComponent } from './host-add-member/host-add-member.component';
import { HostMemberPermissionsDialogComponent } from './host-member-permissions-dialog/host-member-permissions-dialog.component';
import { FromUnixPipe } from 'ngx-moment';
import { ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-host-members',
  templateUrl: './host-members.component.html',
  styleUrls: ['./host-members.component.scss']
})
export class HostMembersComponent implements OnInit {
  hostId: string;
  memberTable: UiTable<IUserHostInfo>;

  constructor(private hostService: HostService, private helperService: HelperService, private dialog: MatDialog) {}

  async ngOnInit() {
    this.hostId = this.hostService.currentHostValue._id;

    const hostPermissionPipe = new HostPermissionPipe();
    const fromUnixPipe = new FromUnixPipe();
    this.memberTable = new UiTable<IUserHostInfo>({
      resolver: query => this.hostService.readMembers(this.hostId, query),
      columns: [
        {
          label: $localize`User`,
          accessor: uhi => uhi.user.username,
          image: uhi => uhi.user.avatar || '/assets/avatar-placeholder.png'
        },
        {
          label: $localize`Permissions`,
          accessor: uhi => hostPermissionPipe.transform(uhi.permissions)
        },
        {
          label: $localize`Joined`,
          accessor: uhi => fromUnixPipe.transform(uhi.joined_at)
        }
      ],
      actions: [
        {
          click: uhi => this.openMemberPermissionsDialog(uhi),
          icon: 'edit',
          hidden: uhi => {
            return (
              uhi.permissions == 'host_owner' || uhi.permissions == 'host_pending' || uhi.permissions == 'host_expired'
            );
          }
        },
        {
          click: uhi => console.log(uhi),
          icon: 'delete',
          kind: ThemeKind.Danger
        }
      ],
      pagination: {
        page_sizes: [10, 15, 25],
        initial_page_size: 10
      }
    });
  }

  openAddMembersModal() {
    this.helperService.showDialog(this.dialog.open(HostAddMemberComponent), () => {
      this.memberTable.refresh();
    });
  }

  openMemberPermissionsDialog(uhi: IUserHostInfo) {
    this.helperService.showDialog(
      this.dialog.open(HostMemberPermissionsDialogComponent, { data: { uhi, hostId: this.hostId } }),
      () => {
        this.memberTable.refresh();
      }
    );
  }
}
