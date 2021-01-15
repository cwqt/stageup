import { Component, OnInit } from '@angular/core';
import { IEnvelopedData, IHostOnboarding } from '@eventi/interfaces';
import { AdminService } from "src/app/services/admin.service";

@Component({
  selector: 'app-admin-onboarding-list',
  templateUrl: './admin-onboarding-list.component.html',
  styleUrls: ['./admin-onboarding-list.component.scss']
})
export class AdminOnboardingListComponent implements OnInit {

  private onboardingList: IEnvelopedData<IHostOnboarding[], void>;

  constructor(private adminService: AdminService) { }

  async ngOnInit() {
    await this.getOnboardingProcesses();  
  }

  async getOnboardingProcesses() {
     console.log(await this.adminService.readOnboardingProcesses());
  }

}
