import { StepperSelectionEvent, STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatHorizontalStepper } from '@angular/material/stepper';
import {
  HostOnboardingState,
  HostOnboardingStep,
  IHost,
  IHostOnboarding,
  IOnboardingStep,
  CountryCode,
  PersonTitle,
  IOnboardingStepMap
} from '@core/interfaces';
import { regexes, to } from '@core/helpers';
import { cachize, createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { HostService } from 'apps/frontend/src/app/services/host.service';
import { IUiFormField, UiField, UiForm } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';
import isPostalCode from 'validator/es/lib/isPostalCode';
import { flatten } from 'flat';
import iso3166 from 'i18n-iso-countries';
import parsePhoneNumberFromString from 'libphonenumber-js';

interface IUiStep<T> {
  label: string;
  form: UiForm<T>;
  data: IOnboardingStep<T> | null;
}

// phone(v, CountryCode.GBR)

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
        label: $localize`Proof of Business`,
        data: null,
        form: new UiForm(
          {
            fields: {
              hmrc_company_number: UiField.Number({
                label: $localize`HMRC Company Number`,
                validators: [
                  { type: 'minlength', value: 8 },
                  { type: 'maxlength', value: 8 }
                ]
              }),
              business_contact_number: UiField.Phone({
                label: $localize`Business Contact Number`,
                hint: $localize`Of the form 1724 123321, no leading zero`,
                validators: [{ type: 'required' }]
              }),
              vat_number: UiField.Text({
                label: $localize`VAT Number`,
                hint: $localize`This is 9 or 12 numbers, sometimes with ‘GB’ at the start, like 123456789 or GB123456789`,
                validators: [
                  {
                    type: 'pattern',
                    value: regexes.vat,
                    message: () => $localize`Number must be 9 or 12 digits with or without GB at the start`
                  }
                ]
              }),
              business_address: UiField.Container({
                label: $localize`Business Address`,
                fields: to<
                  {
                    [index in keyof IOnboardingStepMap[HostOnboardingStep.ProofOfBusiness]['data']['business_address']]: IUiFormField;
                  }
                >({
                  city: UiField.Text({
                    label: $localize`City`,
                    validators: [{ type: 'required' }]
                  }),
                  country: UiField.Select({
                    label: $localize`Country`,
                    has_search: true,
                    values: Object.keys(CountryCode).reduce((acc, curr) => {
                      acc.set(curr, { label: iso3166.getName(CountryCode[curr], navigator.language) });
                      return acc;
                    }, new Map()),
                    validators: [{ type: 'required' }]
                  }),
                  postal_code: UiField.Text({
                    label: $localize`Postcode`,
                    validators: [
                      { type: 'required' },
                      {
                        type: 'custom',
                        value: v => isPostalCode(v.value, 'GB'),
                        message: () => $localize`Not a valid postal code`
                      }
                    ]
                  }),
                  line1: UiField.Text({
                    label: $localize`Address Line 1`,
                    validators: [{ type: 'required' }]
                  }),
                  line2: UiField.Text({
                    label: $localize`Address Line 2`,
                    validators: []
                  })
                })
              })
            },
            resolvers: {
              output: async v =>
                this.handleStepCompletion(
                  {
                    ...v,
                    business_contact_number: parsePhoneNumberFromString(
                      `+44${v.business_contact_number}`
                    ).formatInternational()
                  },
                  HostOnboardingStep.ProofOfBusiness
                ),
              input: async () => this.prefetchStepData(HostOnboardingStep.ProofOfBusiness)
            }
          },
          this.stepCacheables[HostOnboardingStep.ProofOfBusiness]
        )
      },
      [HostOnboardingStep.OwnerDetails]: {
        label: $localize`Owner Details`,
        data: null,
        form: new UiForm(
          {
            fields: {
              title: UiField.Select({
                label: $localize`Title`,
                values: new Map<PersonTitle, { label: string }>([
                  [PersonTitle.Mr, { label: $localize`Mr` }],
                  [PersonTitle.Miss, { label: $localize`Miss` }],
                  [PersonTitle.Mrs, { label: $localize`Mrs` }],
                  [PersonTitle.Ms, { label: $localize`Ms` }],
                  [PersonTitle.Dr, { label: $localize`Dr` }],
                  [PersonTitle.Professor, { label: $localize`Professor` }],
                  [PersonTitle.Master, { label: $localize`Master` }]
                ]),
                validators: [{ type: 'required' }]
              }),
              first_name: UiField.Text({
                label: $localize`First name`,
                validators: [{ type: 'required' }]
              }),
              last_name: UiField.Text({
                label: $localize`Last name`,
                validators: [{ type: 'required' }]
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
        label: $localize`Social Presence`,
        data: null,
        form: new UiForm(
          {
            fields: {
              site_url: UiField.Text({ label: $localize`Website` }),
              linkedin_url: UiField.Text({ label: 'LinkedIn' }),
              facebook_url: UiField.Text({ label: 'Facebook' }),
              instagram_url: UiField.Text({ label: 'Instagram' })
            },
            resolvers: {
              output: async formData =>
                this.handleStepCompletion(
                  Object.keys(formData).reduce((acc, curr) => ((acc[curr] = formData[curr] || undefined), acc), {}),
                  HostOnboardingStep.SocialPresence
                ),
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
    if (!this.onReviewStep)
      this.switchStep(Object.keys(this.stepCacheables)[event.selectedIndex] as HostOnboardingStep);
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
