import { Component, Input, OnInit } from '@angular/core';
import { HostOnboardingStep, IOnboardingStep, IOnboardingStepMap, Primitive } from '@eventi/interfaces';
import { AdminService } from 'apps/frontend/src/app/services/admin.service';
import { flatten } from 'flat';
import { BaseAppService, RouteParam } from 'apps/frontend/src/app/services/app.service';
import { ActivatedRoute } from '@angular/router';
import { ICacheable } from '../../../app.interfaces';
import { HttpErrorResponse } from '@angular/common/http';
import { HostService } from '../../../services/host.service';

export interface IUiStepMapField {
  level: number;
  value: Primitive;
  valid: boolean;
  issues: string[] | null;
}

@Component({
  selector: 'app-onboarding-view',
  templateUrl: './onboarding-view.component.html',
  styleUrls: ['./onboarding-view.component.scss']
})
export class OnboardingViewComponent implements OnInit {
  @Input() adminView: boolean = false;
  @Input() hostId: number;

  // TODO: some steps we don't have requirements for yet...
  private SKIPPED_STEPS = [HostOnboardingStep.AddMembers, HostOnboardingStep.SubscriptionConfiguration];
  public activeIssueMaker:[number, number] = [null, null];

  public onboardingFields: Record<HostOnboardingStep, IUiStepMapField[]>;
  public onboardingSteps: ICacheable<IOnboardingStepMap> = {
    data: null,
    loading: false,
    error: ''
  };

  public enactOnboarding: ICacheable<void> = {
    loading: false,
    error: ''
  };

  constructor(private hostService: HostService, private adminService: AdminService) {}

  isActiveIssueMaker(stepIdx, fieldIdx) {
    const [activeStep, activeField] = this.activeIssueMaker;
    return (stepIdx == activeStep && fieldIdx == activeField);
  }

  async ngOnInit() {
    // Get the steps & parse into data structure for template to consume
    await this.getOnboardingSteps();
    if (!this.onboardingSteps.error) {
      this.onboardingFields = this.parseOnboardingStepsIntoRows();
    }
  }

  async getOnboardingSteps() {
    this.onboardingSteps.loading = true;
    return this.hostService
      .readOnboardingSteps(this.hostId)
      .then(d => (this.onboardingSteps.data = d))
      .catch((e: HttpErrorResponse) => (this.onboardingSteps.error = e.message))
      .finally(() => (this.onboardingSteps.loading = false));
  }

  parseOnboardingStepsIntoRows(): Record<HostOnboardingStep, IUiStepMapField[]> {
    return Object.keys(this.onboardingSteps.data)
      .map(step => Number.parseInt(step)) // as HostOnboardingSteps
      .filter(step => !this.SKIPPED_STEPS.includes(step as any)) // don't show skipped steps
      .reduce((acc, step) => {  // parse into IUiStepMapRow
        acc[step as any] = Object.entries(flatten(this.onboardingSteps.data[step].data)).map<IUiStepMapField>(
          ([key, value]) => {
            const splitKey = key.split('.');

            return {
              type: 'text',
              value: value as Primitive,
              key: splitKey.pop().replace(/[._]/g, ' '),
              level: splitKey.length,
              valid: false,
              issues: null
            };
          }
        );

        return acc;
      }, {} as Record<HostOnboardingStep, IUiStepMapField[]>);
  }

  enactOnboardingProcess() {
    this.enactOnboarding.loading = true;
    setTimeout(() => {
      return this.adminService
        .enactOnboardingProcess(this.hostId)
        .catch((e: HttpErrorResponse) => (this.enactOnboarding.error = e.message))
        .finally(() => (this.enactOnboarding.loading = false));
    }, 1000);
  }

  keepOrder = (a, b) => {
    return a;
  };

  addFieldIssue = (stepIdx:number, fieldIdx:number) => {
    this.onboardingFields[stepIdx][fieldIdx].issues = this.onboardingFields[stepIdx][fieldIdx].issues || [];
    this.activeIssueMaker = [stepIdx, fieldIdx];
  }

  allFieldsChecked() {
    console.log(flatten(this.onboardingFields))
    return false
    // return Object.values(flatten())
  }
}
