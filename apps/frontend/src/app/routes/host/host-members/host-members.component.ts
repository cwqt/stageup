import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { IEnvelopedData, IHost, IUserHostInfo, IUserStub } from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from '../../../app.interfaces';
import { HelperService } from '../../../services/helper.service';
import { HostService } from '../../../services/host.service';
import { HostAddMemberComponent } from './host-add-member/host-add-member.component';

@Component({
  selector: 'app-host-members',
  templateUrl: './host-members.component.html',
  styleUrls: ['./host-members.component.scss']
})
export class HostMembersComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  hostMembers: ICacheable<IEnvelopedData<IUserHostInfo[]>> = createICacheable([]);
  hostMembersDataSrc: MatTableDataSource<IUserHostInfo>;
  displayedColumns: string[] = ['user', 'permissions', 'joined_at', 'modify'];

  constructor(private hostService: HostService, private helperService: HelperService, private dialog: MatDialog) {}

  async ngOnInit() {
    this.hostMembersDataSrc = new MatTableDataSource<IUserHostInfo>([]);
    this.hostMembers.loading = true;
  }

  ngAfterViewInit() {
    this.hostMembersDataSrc.paginator = this.paginator;
    cachize(this.hostService.readMembers(this.hostService.hostId), this.hostMembers).then(d => {
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
}
