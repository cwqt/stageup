import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import {
  HostOnboardingState,
  HostOnboardingStep,
  IOnboardingReview,
  IOnboardingStepMap,
  IOnboardingStepReview,
  Primitive
} from '@core/interfaces';
import { AdminService } from 'apps/frontend/src/app/services/admin.service';
import { flatten } from 'flat';
import { cachize, createICacheable, ICacheable } from '../../../app.interfaces';
import { HttpErrorResponse } from '@angular/common/http';
import { HostService } from '../../../services/host.service';

export interface IUiStepMapField {
  level: number;
  value: Primitive;
  key: string;
  prettyKey: string;
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
  @Input() hostId: string;

  // step & field indexes - only have one open at a time
  activeIssueMaker: [number, number] = [null, null];

  onboardingFields: Record<HostOnboardingStep, IUiStepMapField[]>;
  onboardingSteps: ICacheable<IOnboardingStepMap> = createICacheable();
  reviewOnboarding: ICacheable<void> = createICacheable();

  constructor(private hostService: HostService, private adminService: AdminService) {}

  isActiveIssueMaker(stepIdx, fieldIdx) {
    const [activeStep, activeField] = this.activeIssueMaker;
    return stepIdx == activeStep && fieldIdx == activeField;
  }

  async ngOnInit() {
    // Get the steps & parse into data structure for template to consume
    this.initialise();
  }

  async initialise() {
    await this.getOnboardingSteps();
    if (!this.onboardingSteps.error) {
      this.onboardingFields = this.parseOnboardingStepsIntoRows();
    }
  }

  async getOnboardingSteps() {
    return cachize(this.hostService.readOnboardingSteps(this.hostId), this.onboardingSteps);
  }

  parseOnboardingStepsIntoRows(): Record<HostOnboardingStep, IUiStepMapField[]> {
    return this.getAllValidSteps().reduce((acc, step) => {
      // parse into IUiStepMapRow
      acc[step as any] = Object.entries(flatten(this.onboardingSteps.data[step].data)).map<IUiStepMapField>(
        ([key, value]) => {
          const splitKey = key.split('.');

          return {
            type: 'text',
            value: value as Primitive,
            key: key,
            prettyKey: splitKey.pop().replace(/[._]/g, ' '),
            level: splitKey.length,
            valid: false,
            issues: null
          };
        }
      );

      return acc;
    }, {} as Record<HostOnboardingStep, IUiStepMapField[]>);
  }

  getAllValidSteps(): HostOnboardingStep[] {
    return Object.keys(this.onboardingSteps.data).map(step => step as HostOnboardingStep);
  }

  async reviewOnboardingProcess() {
    this.reviewOnboarding.loading = true;

    try {
      // Send the onboarding review & enact
      await this.adminService.reviewOnboarding(
        this.hostId,
        this.getAllValidSteps().reduce((map, step) => {
          map[step] = this.onboardingFields[step].reduce(
            (acc, curr) => {
              if (curr.issues.length > 0) acc.issues = { ...acc.issues, [curr.key]: curr.issues };
              return acc;
            },
            {
              issues: {},
              state: this.onboardingFields[step].some(f => f.issues.length)
                ? HostOnboardingState.HasIssues
                : HostOnboardingState.Verified
            } as IOnboardingStepReview<any>
          );
          return map;
        }, {})
      );
    } catch (error) {
      this.reviewOnboarding.error = error.message;
    } finally {
      this.reviewOnboarding.loading = false;
      this.initialise();
    }
  }

  keepOrder = (a, b) => {
    return a;
  };

  addFieldIssue = (stepIdx: number, fieldIdx: number) => {
    this.onboardingFields[stepIdx][fieldIdx].issues = this.onboardingFields[stepIdx][fieldIdx].issues || [];
    this.activeIssueMaker = [stepIdx, fieldIdx];
  };

  getUncheckedCount(): number {
    const flatList: Record<string, IUiStepMapField> = flatten(this.onboardingFields);

    const unchecked = Object.keys(flatList)
      .filter(k => k.includes('valid'))
      .reduce((acc, curr) => {
        if (!flatList[curr]) acc += 1;
        return acc;
      }, 0);

    return unchecked;
  }

  checkAll() {
    Object.keys(this.onboardingFields).forEach(k => {
      Object.keys(this.onboardingFields[k]).forEach(f => {
        this.onboardingFields[k][f].valid = !this.onboardingFields[k][f].valid;
      });
    });
  }
}
