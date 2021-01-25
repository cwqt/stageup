import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { IEnvelopedData, IHostOnboarding } from '@eventi/interfaces';
import { AdminService } from "apps/frontend/src/app/services/admin.service";
import { ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';

@Component({
  selector: 'app-admin-onboarding-list',
  templateUrl: './admin-onboarding-list.component.html',
  styleUrls: ['./admin-onboarding-list.component.scss']
})
export class AdminOnboardingListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  onboardingsDataSrc:MatTableDataSource<IHostOnboarding>;
  displayedColumns: string[] = ['host', 'state', 'last_modified', 'onboarding_page'];
  onboardings:ICacheable<IEnvelopedData<IHostOnboarding[], void>> = {
    data: null,
    loading: false,
    error: ""
  }

  constructor(private adminService: AdminService, private appService:BaseAppService) { }

  get pager():MatPaginator { return this.onboardingsDataSrc.paginator }

  ngOnInit() {
    this.onboardingsDataSrc = new MatTableDataSource<IHostOnboarding>([]);
    this.getOnboardingProcesses();
  }

  ngAfterViewInit() {
    this.onboardingsDataSrc.paginator = this.paginator;
  }

  async getOnboardingProcesses() {
    this.onboardings.loading = true;
    return this.adminService.readOnboardingProcesses(this.pager?.pageIndex, this.pager?.pageSize)
      .then(d => {
        this.onboardings.data = d;
        this.onboardingsDataSrc.data = d.data;
        if(this.pager) {
          this.pager.length = d.__paging_data.total;
        }
      })
      .catch(e => this.onboardings.error = e)
      .finally(() => this.onboardings.loading = false)
  }

  openOnboarding(onboarding:IHostOnboarding) {
    this.appService.navigateTo(`/admin/onboarding/${onboarding._id}`);
  }
}
