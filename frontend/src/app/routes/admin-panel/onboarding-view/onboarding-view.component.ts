import { Component, OnInit } from '@angular/core';
import { IOnboardingStepMap } from '@eventi/interfaces';
import { AdminService } from 'src/app/services/admin.service';
import { flatten } from "flat";
import { BaseAppService, RouteParam } from 'src/app/services/app.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-onboarding-view',
  templateUrl: './onboarding-view.component.html',
  styleUrls: ['./onboarding-view.component.scss']
})
export class OnboardingViewComponent implements OnInit {

  public onboardingSteps: IOnboardingStepMap;
  public hostId: number;
  
  constructor(private adminService: AdminService, private _Activatedroute:ActivatedRoute) { }

  ngOnInit(): void {
    this.getOnboardingSteps();
  }

  async getOnboardingSteps(){
    this.onboardingSteps = await this.adminService.readOnboardingSteps(this._Activatedroute.snapshot.paramMap.get("hostId") as unknown as number);
    this.flattenOnboardingStepMap();
  }

  flattenOnboardingStepMap(){
    Object.entries(this.onboardingSteps).forEach(([step, stepData]) => {this.onboardingSteps[step] = flatten(stepData)});
  }

  checkForDataField(field: string){
      if (field.substr(0, 4) === "data") return true;
      return false;
  }

  getPrettyDataFieldKey(field: string): string{
    //Extract the word after the last '.' and replace 
    return field.substr(field.lastIndexOf("."), field.length).replace(/[._]/g, " ");
  }
}

