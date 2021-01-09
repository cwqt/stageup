import { Component, Input, OnInit } from "@angular/core";
import {
  IHost,
  IHostOnboarding,
  HostOnboardingState,
  HostOnboardingStep,
  IOnboardingStep,
} from "@eventi/interfaces";
import { ICacheable } from "src/app/app.interfaces";
import { HostService } from "src/app/services/host.service";
import { IUiForm } from "src/app/ui-lib/form/form.interfaces";

const createICacheable = ():ICacheable<null> => {
  return {
    data: null,
    loading: false,
    error: "",
    form_errors: {}
  }
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
})
export class HostOnboardingComponent implements OnInit {
  @Input() host: IHost;

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
            validators: [
              { type: "minlength", value: 8, message: v => "Must be 8 characters" },
              { type: "maxlength", value: 8, message: v => "Must be 8 characters" },
            ]
          },
          {
            type: "text",
            field_name: "business_contact_number",
            label:"Business Contact Number",
            validators: [{type: "required"}]
          },
          {
            type: "container",
            field_name: "business_address",
            label: "Business Address",
            fields: [          
              { type: "text", label: "City",          field_name: "city", validators: [{type: "required"}]},
              { type: "text", label: "Country",       field_name: "iso_country_code", validators: [{type: "required"}]},
              { type: "text", label: "Postcode",      field_name: "postcode", validators: [{type: "required"}]},
              { type: "text", label: "Street Name",   field_name: "street_name", validators: [{type: "required"}]},
              { type: "text", label: "Street Number", field_name: "street_number", validators: [{type: "required"}]},
            ],
          },
          { type: "checkbox", field_name: "checker"}
        ],
        submit: {
          variant: "primary",
          text: "Next",
          handler: async () => {}
        }
      }
    },
    // [HostOnboardingStep.OwnerDetails]: {
    //   label: "Owner Details",
    //   data: null,
    //   form: {
    //     fields: [],
    //     submit: {
    //       variant: "primary",
    //       text: "",
    //       handler: async () => {}
    //     }
    //   }
    // },
    // [HostOnboardingStep.SocialPresence]: {
    //   label: "Social Presence",
    //   data: null,
    //   form: {
    //     fields: [],
    //     submit: {
    //       variant: "primary",
    //       text: "",
    //       handler: async () => {}
    //     }
    //   }
    // },
    // [HostOnboardingStep.AddMembers]: {
    //   label: "Add Members",
    //   data: null,
    //   form: {
    //     fields: [],
    //     submit: {
    //       variant: "primary",
    //       text: "",
    //       handler: async () => {}
    //     }
    //   }
    // },
    // [HostOnboardingStep.SubscriptionConfiguration]: {
    //   label: "Subscription Configuration",
    //   data: null,
    //   form: {
    //     fields: [],
    //     submit: {
    //       variant: "primary",
    //       text: "",
    //       handler: async () => {}
    //     }
    //   }
    // },
  }

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

  constructor(private hostService: HostService) {}

  ngOnInit(): void {
    this.getOnboarding();
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
