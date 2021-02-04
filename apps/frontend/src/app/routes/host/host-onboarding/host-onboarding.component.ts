import { StepperSelectionEvent, STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatVerticalStepper } from '@angular/material/stepper';
import {
  IHost,
  IHostOnboarding,
  HostOnboardingState,
  HostOnboardingStep,
  IOnboardingStep,
  ISOCountryCode,
  PersonTitle
} from '@core/interfaces';
import { createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { HostService } from 'apps/frontend/src/app/services/host.service';
import { IUiForm, IUiFieldSelectOptions, IUiFormPrefetchData } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';
import phone from 'phone';
import isPostalCode from 'validator/es/lib/isPostalCode';
import { HttpErrorResponse } from '@angular/common/http';
import { flatten } from 'flat';

interface IUiStep<T> {
  label: string;
  form: IUiForm<T>;
  data: IOnboardingStep<T> | null;
}

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
  host: IHost;
  @ViewChild(MatVerticalStepper, { static: false }) stepper: MatVerticalStepper;

  public states: typeof HostOnboardingState = HostOnboardingState;

  onReviewStep: boolean = false;
  selectedStep: HostOnboardingStep;
  componentRefreshing: boolean = true;
  onboarding: ICacheable<IHostOnboarding> = {
    data: null,
    loading: false,
    error: ''
  };

  // For when the user submits for verification
  submission: ICacheable<null> = {
    data: null,
    loading: false,
    error: ''
  };

  stepData = createICacheable<IOnboardingStep<any>>();
  stepCacheables: {
    [index in HostOnboardingStep]: ICacheable<IOnboardingStep<any>>;
  } = {
    [HostOnboardingStep.ProofOfBusiness]: createICacheable(),
    [HostOnboardingStep.OwnerDetails]: createICacheable(),
    [HostOnboardingStep.SocialPresence]: createICacheable(),
    [HostOnboardingStep.AddMembers]: createICacheable(),
    [HostOnboardingStep.SubscriptionConfiguration]: createICacheable()
  };

  stepStatusUiMap: {
    [index in HostOnboardingState]: { color: string; icon: string };
  } = {
    [HostOnboardingState.AwaitingChanges]: { color: '', icon: 'edit' },
    [HostOnboardingState.Enacted]: { color: '', icon: 'checkmark--filled' },
    [HostOnboardingState.HasIssues]: { color: '', icon: 'warning' },
    [HostOnboardingState.PendingVerification]: { color: '', icon: 'pending' },
    [HostOnboardingState.Verified]: { color: '', icon: 'checkmark--outline' }
  };

  stepUiMap: { [index in HostOnboardingStep]?: IUiStep<any> } = {
    [HostOnboardingStep.ProofOfBusiness]: {
      label: 'Proof of Business',
      data: null,
      form: {
        prefetch: async () => this.prefetchStepData(HostOnboardingStep.ProofOfBusiness),
        fields: {
          hmrc_company_number: {
            type: 'number',
            label: 'HMRC Company Number',
            validators: [
              { type: 'minlength', value: 8 },
              { type: 'maxlength', value: 8 }
            ]
          },
          business_contact_number: {
            type: 'phone',
            label: 'Business Contact Number',
            hint: 'Of the form 1724 123321, no leading zero',
            validators: [{ type: 'required' }],
            options: {
              transformer: v => phone(v, ISOCountryCode.GBR)
            }
          },
          business_address: {
            type: 'container',
            label: 'Business Address',
            fields: {
              city: {
                type: 'text',
                label: 'City',
                validators: [{ type: 'required' }]
              },
              iso_country_code: {
                type: 'select',
                label: 'Country',
                options: {
                  search: true,
                  values: Object.keys(ISOCountryCode).reduce((acc, curr, idx) => {
                    acc.push({
                      key: curr,
                      value: Object.values(ISOCountryCode)[idx]
                    });
                    return acc;
                  }, [])
                },
                validators: [{ type: 'required' }]
              },
              postcode: {
                type: 'text',
                label: 'Postcode',
                validators: [
                  { type: 'required' },
                  {
                    type: 'custom',
                    value: v => isPostalCode(v.value, 'GB'),
                    message: v => `Not a valid postal code`
                  }
                ]
              },
              street_number: {
                type: 'number',
                label: 'Street Number',
                validators: [{ type: 'required' }]
              },
              street_name: {
                type: 'text',
                label: 'Street Name',
                validators: [{ type: 'required' }]
              }
            }
          }
        },
        submit: {
          variant: 'primary',
          text: 'Next',
          handler: async formData => this.handleStepCompletion(formData, HostOnboardingStep.ProofOfBusiness)
        }
      }
    },
    [HostOnboardingStep.OwnerDetails]: {
      label: 'Owner Details',
      data: null,
      form: {
        prefetch: async () => this.prefetchStepData(HostOnboardingStep.OwnerDetails),
        fields: {
          owner_info: {
            type: 'container',
            label: 'Owner Information',
            fields: {
              title: {
                type: 'select',
                label: 'Title',
                options: {
                  values: Object.values(PersonTitle).reduce<IUiFieldSelectOptions['values']>((acc, curr) => {
                    acc.push({
                      key: curr,
                      value: curr.charAt(0).toUpperCase() + curr.slice(1)
                    });
                    return acc;
                  }, [])
                },
                validators: [{ type: 'required' }]
              },
              first_name: {
                type: 'text',
                label: 'First name',
                validators: [{ type: 'required' }]
              },
              last_name: {
                type: 'text',
                label: 'Last name',
                validators: [{ type: 'required' }]
              }
            }
          }
        },
        submit: {
          variant: 'primary',
          text: 'Next',
          handler: async formData => this.handleStepCompletion(formData, HostOnboardingStep.OwnerDetails)
        }
      }
    },
    [HostOnboardingStep.SocialPresence]: {
      label: 'Social Presence',
      data: null,
      form: {
        prefetch: async () => this.prefetchStepData(HostOnboardingStep.SocialPresence),
        fields: {
          social_info: {
            type: 'container',
            label: 'Social Information',
            fields: {
              linkedin_url: { type: 'text', label: 'LinkedIn' },
              facebook_url: { type: 'text', label: 'Facebook' },
              instagram_url: { type: 'text', label: 'Instagram' }
            }
          }
        },
        submit: {
          variant: 'primary',
          text: 'Next',
          handler: async formData => this.handleStepCompletion(formData, HostOnboardingStep.SocialPresence)
        }
      }
    }
    // TODO: Doesn't seem necessary at this stage to add members
    // [HostOnboardingStep.AddMembers]: {
    //   label: "Add Members",
    //   data: null,
    //   form: {
    //     fields: [],
    //     submit: {
    //       variant: "primary",
    //       text: "Next",
    //       handler: async () => {},
    //     },
    //   },
    // },
    // TODO: not enough requirements on subscriptions at this stage to comment
    // [HostOnboardingStep.SubscriptionConfiguration]: {
    //   label: "Subscription Configuration",
    //   data: null,
    //   form: {
    //     fields: [
    //       { type: "number", field_name: "tier", label: "Subscription Tier" },
    //     ],
    //     submit: {
    //       variant: "primary",
    //       text: "Next",
    //       handler: async () => {},
    //     },
    //   },
    // },
  };

  constructor(private hostService: HostService) {}

  async ngOnInit() {
    this.host = await this.hostService.getHost(this.hostService.currentHostValue._id);
    this.getOnboarding().then(() => this.switchStep(HostOnboardingStep.ProofOfBusiness));
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
  get addMembers() {
    return this.steps[HostOnboardingStep.AddMembers];
  }
  get socialPresence() {
    return this.steps[HostOnboardingStep.SocialPresence];
  }
  get subscriptionConfig() {
    return this.steps[HostOnboardingStep.SubscriptionConfiguration];
  }
  get currentState() {
    return this.onboarding.data.state;
  }

  async prefetchStepData(step: HostOnboardingStep): Promise<IUiFormPrefetchData> {
    const stepData = this.stepData?.data || (await this.hostService.readOnboardingProcessStep(this.host._id, step));

    return {
      fields: flatten<any, IUiFormPrefetchData['fields']>(stepData.data),
      errors: Object.keys(stepData.review?.issues || []).reduce((acc, curr) => {
        acc[curr] = stepData.review.issues[curr];
        return acc;
      }, {})
    };
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
      .then(() => this.stepper.next())
      .finally(() => console.log(this.stepCacheables));
  }

  handleStepSuccess(step: HostOnboardingStep) {}

  handleStepFailure(step: HostOnboardingStep) {}

  async readCurrentStep(step: HostOnboardingStep) {
    this.stepData.loading = true;
    return this.hostService
      .readOnboardingProcessStep(this.host._id, step)
      .then(data => (this.stepData.data = data))
      .catch((e: HttpErrorResponse) => (this.stepData.error = e.message))
      .finally(() => (this.stepData.loading = false));
  }

  async getOnboarding() {
    this.onboarding.loading = true;
    return this.hostService
      .readOnboardingProcessStatus(this.host._id)
      .then(o => (this.onboarding.data = o))
      .catch((e: HttpErrorResponse) => (this.onboarding.error = e.message))
      .finally(() => (this.onboarding.loading = false));
  }

  async submitForVerification() {
    this.submission.loading = true;
    return this.hostService
      .submitOnboardingProcess(this.host._id)
      .then(() => (this.onboarding.data.state = HostOnboardingState.PendingVerification))
      .catch((e: HttpErrorResponse) => (this.submission.error = e.message))
      .finally(() => (this.submission.loading = false));
  }
}
