import { HostPermissionPipe } from './../../../_pipes/host-permission.pipe';
import { UiTable } from '@frontend/ui-lib/table/table.class';
import { AfterViewInit, Component, OnInit, ViewChild, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { IEnvelopedData, IUserHostInfo, HostPermission } from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from '../../../app.interfaces';
import { HelperService } from '../../../services/helper.service';
import { HostService } from '../../../services/host.service';
import { HostAddMemberComponent } from './host-add-member/host-add-member.component';
import { HostMemberPermissionsDialogComponent } from './host-member-permissions-dialog/host-member-permissions-dialog.component';
import { FromUnixPipe } from 'ngx-moment';

@Component({
  selector: 'app-host-members',
  templateUrl: './host-members.component.html',
  styleUrls: ['./host-members.component.scss']
})
export class HostMembersComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() permission: IUserHostInfo['permissions'];

  hostMembers: ICacheable<IEnvelopedData<IUserHostInfo[]>> = createICacheable([]);
  hostMembersDataSrc: MatTableDataSource<IUserHostInfo>;
  displayedColumns: string[] = ['user', 'permissions', 'joined_at', 'actions'];
  valueSelected: HostPermission;
  hostId: string;

  // Members
  memberTable: UiTable<IUserHostInfo>;

  constructor(private hostService: HostService, private helperService: HelperService, private dialog: MatDialog) {}

  async ngOnInit() {
    this.hostId = this.hostService.currentHostValue._id;
    this.hostMembersDataSrc = new MatTableDataSource<IUserHostInfo>([]);
    this.hostMembers.loading = true;

    const hostPermissionPipe = new HostPermissionPipe();
    const fromUnixPipe = new FromUnixPipe();
    this.memberTable = new UiTable<IUserHostInfo>({
      resolver: query => this.hostService.readMembers(this.hostId, query),
      columns: [
        {
          label: $localize`User`,
          accessor: member => member.user.username,
          image: member => member.user.avatar || '/assets/avatar-placeholder.png'
        },
        {
          label: $localize`Permissions`,
          accessor: member => hostPermissionPipe.transform(member.permissions)
        },
        {
          label: $localize`Joined`,
          accessor: member => fromUnixPipe.transform(member.joined_at)
        }
      ],
      actions: [
        {
          label: '',
          click: p => console.log(p),
          icon: 'delete'
        }
      ],
      pagination: {
        page_sizes: [10, 15, 25],
        initial_page_size: 10
      }
    });
  }

  ngAfterViewInit() {
    this.hostMembersDataSrc.paginator = this.paginator;
    cachize(this.hostService.readMembers(this.hostService.hostId, null), this.hostMembers).then(d => {
      this.hostMembersDataSrc.data = d.data;
      this.hostMembersDataSrc.paginator.length = d.__paging_data.total;
    });
  }

  openAddMembersModal() {
    this.helperService.showDialog(this.dialog.open(HostAddMemberComponent), (newMembers: IUserHostInfo[]) => {
      this.hostMembers.data.data = [...this.hostMembers.data.data, ...newMembers];
      this.hostMembersDataSrc.data = this.hostMembers.data.data;
      this.hostMembersDataSrc.paginator.length += newMembers.length;
    });
  }

  openMemberPermissionsDialog(userId: string) {
    const uhi = this.hostMembers.data.data.find(u => u.user._id == userId);

    this.helperService.showDialog(
      this.dialog.open(HostMemberPermissionsDialogComponent, { data: { uhi: uhi, hostId: this.hostId } }),
      (permission: HostPermission) => {
        uhi.permissions = permission;
      }
    );
  }
}
