import { StepperSelectionEvent, STEPPER_GLOBAL_OPTIONS } from "@angular/cdk/stepper";
import { AfterViewInit, Component, ComponentFactoryResolver, Input, OnInit, QueryList, ViewChild, ViewChildren } from "@angular/core";
import { MatVerticalStepper } from "@angular/material/stepper";
import {
  IHost,
  IHostOnboarding,
  HostOnboardingState,
  HostOnboardingStep,
  IOnboardingStep,
} from "@eventi/interfaces";
import { createICacheable, ICacheable } from "src/app/app.interfaces";
import { HostService } from "src/app/services/host.service";
import { FormComponent } from "src/app/ui-lib/form/form.component";
import { IUiForm } from "src/app/ui-lib/form/form.interfaces";


import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[pageDirective]'
})
export class PageDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}

interface IUiStep<T> {
  label: string;
  form:IUiForm<T>;
  data: IOnboardingStep<T> | null;
}

@Component({
  selector: "app-host-onboarding",
  templateUrl: "./host-onboarding.component.html",
  styleUrls: ["./host-onboarding.component.scss"],
  providers: [{
    provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true }
  }]
})
export class HostOnboardingComponent implements OnInit, AfterViewInit {
  @Input() host: IHost;
  @ViewChild(MatVerticalStepper, { static: false }) stepper:MatVerticalStepper;
  @ViewChild(PageDirective) pageHost: PageDirective;

  selectedStep:HostOnboardingStep;
  componentRefreshing:boolean = true;
  onboarding: ICacheable<IHostOnboarding> = {
    data: null,
    loading: false,
    error: "",
  };

  stepData:{[index in HostOnboardingStep]:ICacheable<IOnboardingStep<any>>} = {
    [HostOnboardingStep.ProofOfBusiness]: createICacheable(),
    [HostOnboardingStep.OwnerDetails]: createICacheable(),
    [HostOnboardingStep.SocialPresence]: createICacheable(),
    [HostOnboardingStep.AddMembers]: createICacheable(),
    [HostOnboardingStep.SubscriptionConfiguration]: createICacheable(),
  }

  stepStatusUiMap: {
    [index in HostOnboardingState]: { color: string; icon: string };
  } = {
    [HostOnboardingState.AwaitingChanges]: { color: "", icon: "edit" },
    [HostOnboardingState.Enacted]: { color: "", icon: "checkmark--filled" },
    [HostOnboardingState.HasIssues]: { color: "", icon: "warning" },
    [HostOnboardingState.PendingVerification]: { color: "", icon: "pending" },
    [HostOnboardingState.Verified]: { color: "", icon: "checkmark--outline" },
  };

  stepUiMap:{[index in HostOnboardingStep]?:IUiStep<any>} = {
    [HostOnboardingStep.ProofOfBusiness]: {
      label: "Proof of Business",
      data: null,
      form: {
        fields: [
          {
            type: "number",
            field_name: "hmrc_company_number",
            label:"HMRC Company Number",
            initial: 12341234,
            validators: [
              { type: "minlength", value: 8, message: v => "Must be 8 characters" },
              { type: "maxlength", value: 8, message: v => "Must be 8 characters" },
            ]
          },
          {
            type: "phone",
            initial: 1234,
            field_name: "business_contact_number",
            label:"Business Contact Number",
            validators: [{type: "required"}]
          },
          {
            type: "container",
            field_name: "business_address",
            label: "Business Address",
            fields: [          
              { initial: "123", type: "text",   label: "City",          field_name: "city", validators: [{type: "required"}]},
              { initial: 123, type: "text",   label: "Country",       field_name: "iso_country_code", validators: [{type: "required"}]},
              { initial: 1111, type: "text",   label: "Postcode",      field_name: "postcode", validators: [{type: "required"}]},
              { initial: 123, type: "number", label: "Street Number", field_name: "street_number", validators: [{type: "required"}]},
              { initial: 444, type: "text",   label: "Street Name",   field_name: "street_name", validators: [{type: "required"}]},
            ],
          },
        ],
        submit: {
          variant: "primary",
          text: "Next",
          handler: async formData => this.handleStepCompletion(formData, HostOnboardingStep.ProofOfBusiness)
        }
      }
    },
    [HostOnboardingStep.OwnerDetails]: {
      label: "Owner Details",
      data: null,
      form: {
        fields: [
          {
            type: "container",
            field_name: "owner_info",
            label: "Owner Information",
            fields: [
              { type: "text", field_name: "title", label: "Title" },
              { type: "text", field_name: "first_name", label: "First name" },
              { type: "text", field_name: "last_name", label: "Last name" },    
            ]
          }
        ],
        submit: {
          variant: "primary",
          text: "Next",
          handler: async () => {}
        }
      }
    },
    [HostOnboardingStep.SocialPresence]: {
      label: "Social Presence",
      data: null,
      form: {
        fields: [
          {
            type: "container",
            field_name: "social",
            label: "Social Information",
            fields: [
              { type: "text", field_name: "linkedin_url", label: "LinkedIn" },
              { type: "text", field_name: "facebook_url", label: "Facebook" },
              { type: "text", field_name: "instagram_url", label: "Instagram" },    
            ]
          }
        ],
        submit: {
          variant: "primary",
          text: "Next",
          handler: async formData => this.handleStepCompletion(formData, HostOnboardingStep.SocialPresence)
        }
      }
    },
    [HostOnboardingStep.AddMembers]: {
      label: "Add Members",
      data: null,
      form: {
        fields: [],
        submit: {
          variant: "primary",
          text: "Next",
          handler: async () => {}
        }
      }
    },
    [HostOnboardingStep.SubscriptionConfiguration]: {
      label: "Subscription Configuration",
      data: null,
      form: {
        fields: [
          { type: "number", field_name: "tier", label: "Subscription Tier"}
        ],
        submit: {
          variant: "primary",
          text: "Next",
          handler: async () => {}
        }
      }
    },
  }

  constructor(private hostService: HostService, private cfr:ComponentFactoryResolver) {}

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

  switchStep(step:HostOnboardingStep) {
    this.componentRefreshing = true;
    this.selectedStep = step;
    setTimeout(() => { // push to next tick
      this.componentRefreshing = false;
    }, 0);
  }

  ngOnInit(): void {
    this.getOnboarding().then(() => this.switchStep(HostOnboardingStep.ProofOfBusiness));
  }

  ngAfterViewInit() {
  }

  handleSelectionChange(event:StepperSelectionEvent) {
    console.log(event)
    this.switchStep(event.selectedIndex)
  };

  handleStepCompletion(formData:any, step:HostOnboardingStep) {
    console.log(formData, step)
    return this.hostService.updateOnboardingProcessStep(this.host._id, step, formData)
      .then(() => this.stepper.next())
      .finally(() => console.log(this.stepData))
  }

  handleStepSuccess(step:HostOnboardingStep) {

  }

  handleStepFailure(step:HostOnboardingStep) {

  }

  async getOnboarding() {
    this.onboarding.loading = true;
    return this.hostService
      .readOnboardingProcessStatus(this.host._id)
      .then((o) => (this.onboarding.data = o))
      .catch((e) => (this.onboarding.error = e.message))
      .finally(() => (this.onboarding.loading = false));
  }
}
