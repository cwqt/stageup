import { StepperSelectionEvent, STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatHorizontalStepper, MatVerticalStepper } from '@angular/material/stepper';
import {
  capitalize,
  HostOnboardingState,
  HostOnboardingStep,
  IHost,
  IHostOnboarding,
  IOnboardingStep,
  ISOCountryCode,
  PersonTitle
} from '@core/interfaces';
import { enumToValues } from '@core/shared/helpers';
import { cachize, createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { HostService } from 'apps/frontend/src/app/services/host.service';
import { UiField, UiForm } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';
import isPostalCode from 'validator/es/lib/isPostalCode';
import { flatten } from 'flat';

interface IUiStep<T> {
  label: string;
  form: UiForm<T>;
  data: IOnboardingStep<T> | null;
}

// phone(v, ISOCountryCode.GBR)

@Component({
  selector: 'app-host-onboarding',
  templateUrl: './host-onboarding.component.html',
  styleUrls: ['./host-onboarding.component.scss'],
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { showError: true, displayDefaultIndicatorType: false }
    }
  ]
})
export class HostOnboardingComponent implements OnInit, AfterViewInit {
  @ViewChild(MatHorizontalStepper, { static: false }) stepper: MatHorizontalStepper;
  host: IHost;

  public states: typeof HostOnboardingState = HostOnboardingState;

  onReviewStep: boolean = false;
  selectedStep: HostOnboardingStep;
  componentRefreshing: boolean = true;
  onboarding: ICacheable<IHostOnboarding> = createICacheable();

  // For when the user submits for verification
  submission: ICacheable<null> = createICacheable();

  stepData = createICacheable<IOnboardingStep<any>>();
  stepCacheables: {
    [index in HostOnboardingStep]: ICacheable<IOnboardingStep<any>>;
  } = {
    [HostOnboardingStep.ProofOfBusiness]: createICacheable(),
    [HostOnboardingStep.OwnerDetails]: createICacheable(),
    [HostOnboardingStep.SocialPresence]: createICacheable()
  };

  stepStatusUiMap: {
    [index in HostOnboardingState]: { color: string; icon: string };
  } = {
    [HostOnboardingState.AwaitingChanges]: { color: '', icon: 'edit' },
    [HostOnboardingState.Enacted]: { color: '', icon: 'checkmark--filled' },
    [HostOnboardingState.HasIssues]: { color: '', icon: 'warning' },
    [HostOnboardingState.PendingVerification]: { color: '', icon: 'pending' },
    [HostOnboardingState.Verified]: { color: '', icon: 'checkmark--outline' },
    [HostOnboardingState.Modified]: { color: '', icon: 'edit' }
  };

  stepUiMap: { [index in HostOnboardingStep]?: IUiStep<any> };

  constructor(private hostService: HostService) {}

  async ngOnInit() {
    this.host = await this.hostService.readHost(this.hostService.currentHostValue._id);
    await this.getOnboarding();

    this.stepUiMap = {
      [HostOnboardingStep.ProofOfBusiness]: {
        label: 'Proof of Business',
        data: null,
        form: new UiForm(
          {
            // prefetch: async () => this.prefetchStepData(HostOnboardingStep.ProofOfBusiness),
            fields: {
              hmrc_company_number: UiField.Number({
                label: 'HMRC Company Number',
                validators: [
                  { type: 'minlength', value: 8 },
                  { type: 'maxlength', value: 8 }
                ]
              }),
              business_contact_number: UiField.Phone({
                label: 'Business Contact Number',
                hint: 'Of the form 1724 123321, no leading zero',
                validators: [{ type: 'required' }]
              }),
              business_address: UiField.Container({
                label: 'Business Address',
                fields: {
                  city: UiField.Text({
                    label: 'City',
                    validators: [{ type: 'required' }]
                  }),
                  iso_country_code: UiField.Select({
                    label: 'Country',
                    has_search: true,
                    values: Object.keys(ISOCountryCode).reduce((acc, curr) => {
                      acc.set(curr, { label: ISOCountryCode[curr] });
                      return acc;
                    }, new Map()),
                    validators: [{ type: 'required' }]
                  }),
                  postcode: UiField.Text({
                    label: 'Postcode',
                    validators: [
                      { type: 'required' },
                      {
                        type: 'custom',
                        value: v => isPostalCode(v.value, 'GB'),
                        message: () => `Not a valid postal code`
                      }
                    ]
                  }),
                  street_number: UiField.Number({
                    label: 'Street Number',
                    validators: [{ type: 'required' }]
                  }),
                  street_name: UiField.Text({
                    label: 'Street Name',
                    validators: [{ type: 'required' }]
                  })
                }
              })
            },
            resolvers: {
              output: async v => this.handleStepCompletion(v, HostOnboardingStep.ProofOfBusiness),
              input: async () => this.prefetchStepData(HostOnboardingStep.ProofOfBusiness)
            }
          },
          this.stepCacheables[HostOnboardingStep.ProofOfBusiness]
        )
      },
      [HostOnboardingStep.OwnerDetails]: {
        label: 'Owner Details',
        data: null,
        form: new UiForm(
          {
            fields: {
              owner_info: UiField.Container({
                label: 'Owner Information',
                fields: {
                  title: UiField.Select({
                    label: 'Title',
                    values: new Map(enumToValues(PersonTitle).map(title => [title, { label: capitalize(title) }])),
                    validators: [{ type: 'required' }]
                  }),
                  first_name: UiField.Text({
                    label: 'First name',
                    validators: [{ type: 'required' }]
                  }),
                  last_name: UiField.Text({
                    label: 'Last name',
                    validators: [{ type: 'required' }]
                  })
                }
              })
            },
            resolvers: {
              output: async formData => this.handleStepCompletion(formData, HostOnboardingStep.OwnerDetails),
              input: async () => this.prefetchStepData(HostOnboardingStep.OwnerDetails)
            }
          },
          this.stepCacheables[HostOnboardingStep.OwnerDetails]
        )
      },
      [HostOnboardingStep.SocialPresence]: {
        label: 'Social Presence',
        data: null,
        form: new UiForm(
          {
            fields: {
              social_info: UiField.Container({
                label: 'Social Information',
                fields: {
                  site_url: UiField.Text({ label: 'Website' }),
                  linkedin_url: UiField.Text({ label: 'LinkedIn' }),
                  facebook_url: UiField.Text({ label: 'Facebook' }),
                  instagram_url: UiField.Text({ label: 'Instagram' })
                }
              })
            },
            resolvers: {
              output: async formData => this.handleStepCompletion(formData, HostOnboardingStep.SocialPresence),
              input: async () => this.prefetchStepData(HostOnboardingStep.SocialPresence)
            }
          },
          this.stepCacheables[HostOnboardingStep.SocialPresence]
        )
      }
    };

    this.switchStep(HostOnboardingStep.ProofOfBusiness);
  }

  ngAfterViewInit() {}

  get steps() {
    return this.onboarding.data.steps;
  }
  get proofOfBusiness() {
    return this.steps[HostOnboardingStep.ProofOfBusiness];
  }
  get ownerDetails() {
    return this.steps[HostOnboardingStep.OwnerDetails];
  }
  get socialPresence() {
    return this.steps[HostOnboardingStep.SocialPresence];
  }
  get currentState() {
    return this.onboarding.data.state;
  }

  async prefetchStepData(step: HostOnboardingStep): Promise<any> {
    console.log(this.onboarding);

    // Only perform prefetches if the user has submitted this onboarding before
    if (this.onboarding.data.steps[step] !== HostOnboardingState.AwaitingChanges) {
      const stepData = this.stepData?.data || (await this.hostService.readOnboardingProcessStep(this.host._id, step));

      return {
        fields: flatten(stepData.data),
        errors: Object.keys(stepData.review?.issues || []).reduce((acc, curr) => {
          acc[curr] = stepData.review.issues[curr];
          return acc;
        }, {})
      };
    }
  }

  switchStep(step: HostOnboardingStep) {
    this.componentRefreshing = true;
    this.selectedStep = step;

    // Show on next tick to avoid val changed during change detection loop err
    const nextTickPush = () =>
      setTimeout(() => {
        this.componentRefreshing = false;
      }, 0);

    // Fetch the current states reviews
    if (this.onboarding.data.steps[step] == HostOnboardingState.HasIssues) {
      this.stepData.loading = true;
      this.hostService
        .readOnboardingProcessStep(this.host._id, step)
        .then(d => (this.stepData.data = d))
        .catch((e: HttpErrorResponse) => (this.stepData.error = e.message))
        .finally(() => {
          this.stepData.loading = false;
          nextTickPush();
        });
    } else {
      nextTickPush();
    }
  }

  handleSelectionChange(event: StepperSelectionEvent) {
    // Review step is the final step after all onboarding stages
    this.onReviewStep = event.selectedIndex == Object.keys(this.stepUiMap).length;
    if (!this.onReviewStep) this.switchStep(event.selectedIndex);
  }

  handleStepCompletion(formData: any, step: HostOnboardingStep) {
    return this.hostService
      .updateOnboardingProcessStep(this.host._id, step, formData)
      .then(d => (this.stepper.next(), d))
      .finally(() => console.log(this.stepCacheables));
  }

  handleStepSuccess(step: HostOnboardingStep) {}

  handleStepFailure(step: HostOnboardingStep) {}

  async readCurrentStep(step: HostOnboardingStep) {
    return cachize(this.hostService.readOnboardingProcessStep(this.host._id, step), this.stepData);
  }

  async getOnboarding() {
    return cachize(this.hostService.readOnboardingProcessStatus(this.host._id), this.onboarding);
  }

  async submitForVerification() {
    return cachize(
      this.hostService.submitOnboardingProcess(this.host._id),
      this.onboarding,
      () => this.onboarding.data
    ).then(() => (this.onboarding.data.state = HostOnboardingState.PendingVerification));
  }
}
