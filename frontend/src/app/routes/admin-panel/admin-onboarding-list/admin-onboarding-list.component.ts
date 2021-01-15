import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { IEnvelopedData, IHostOnboarding, IHostOnboardingProcess } from '@eventi/interfaces';
import { AdminService } from "src/app/services/admin.service";

@Component({
  selector: 'app-admin-onboarding-list',
  templateUrl: './admin-onboarding-list.component.html',
  styleUrls: ['./admin-onboarding-list.component.scss']
})
export class AdminOnboardingListComponent implements OnInit {
  
  public onboardingRequests;
  private onboardingTableData: IEnvelopedData<IHostOnboarding[], void>;
  public displayedColumns: string[] = ['state', 'last_modified', 'host', 'onboarding_page'];
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(private adminService: AdminService) { }

  async ngOnInit() {
    await this.getOnboardingProcesses();  
  }

  ngAfterViewInit() {
    this.onboardingRequests.paginator = this.paginator;
  }

  async getOnboardingProcesses() {
    this.onboardingTableData = await this.adminService.readOnboardingProcesses();
    this.onboardingRequests = new MatTableDataSource<IHostOnboarding>(this.onboardingTableData.data);
  }

}
