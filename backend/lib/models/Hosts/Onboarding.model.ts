import { BaseEntity, Column, Entity, EntityManager, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import {
  HostOnboardingStep,
  HostPermission,
  HostSubscriptionLevel,
  IAddress,
  IContactInfo,
  IErrorResponse,
  IFormErrorField,
  IHostMemberChangeRequest,
  IHostOnboardingProcess,
  IHostOnboardingState,
  IOnboardingAddMembers,
  IOnboardingOwnerDetails,
  IOnboardingProofOfBusiness,
  IOnboardingSocialPresence,
  IOnboardingStep,
  IOnboardingSubscriptionConfiguration,
  IPersonInfo,
  PersonTitle,
} from '@eventi/interfaces';
import { Host } from '../Hosts/Host.model';
import { User } from '../Users/User.model';
import { runMany, validate, validateAsync, validateObject, validators } from '../../common/validate';

@Entity()
export class HostOnboardingProcess extends BaseEntity implements IHostOnboardingProcess {
  @PrimaryGeneratedColumn() _id: number;
  @Column() status: IHostOnboardingState;
  @Column() started_at: number;
  @Column({ nullable: true }) completed_at: number;
  @Column({ nullable: true }) last_modified: number;
  @Column() version: number;
  @Column('jsonb', { nullable: true }) steps: {
    [HostOnboardingStep.ProofOfBusiness]: IOnboardingStep<IOnboardingProofOfBusiness>;
    [HostOnboardingStep.OwnerDetails]: IOnboardingStep<IOnboardingOwnerDetails>;
    [HostOnboardingStep.SocialPresence]: IOnboardingStep<IOnboardingSocialPresence>;
    [HostOnboardingStep.AddMembers]: IOnboardingStep<IOnboardingAddMembers>;
    [HostOnboardingStep.SubscriptionConfiguration]: IOnboardingStep<IOnboardingSubscriptionConfiguration>;
  };

  @OneToOne(() => Host, (host) => host.onboarding_process) @JoinColumn() host: Host;
  @OneToOne(() => User, { eager: true }) @JoinColumn() last_modified_by: User;

  constructor(host: Host, creator: User) {
    super();
    this.status = IHostOnboardingState.AwaitingChanges;
    this.started_at = Math.floor(Date.now() / 1000); //timestamp in seconds
    this.last_modified = this.started_at;
    this.last_modified_by = creator;
    this.host = host;
    this.version = 0;

    this.steps = {
      [HostOnboardingStep.ProofOfBusiness]: {
        status: IHostOnboardingState.AwaitingChanges,
        issues: [],
        data: {
          hmrc_company_number: null,
          business_contact_number: null,
          business_address: null,
        },
      },
      [HostOnboardingStep.OwnerDetails]: {
        status: IHostOnboardingState.AwaitingChanges,
        issues: [],
        data: {
          owner_info: null,
        },
      },
      [HostOnboardingStep.SocialPresence]: {
        status: IHostOnboardingState.AwaitingChanges,
        issues: [],
        data: {
          social_info: null,
        },
      },
      [HostOnboardingStep.AddMembers]: {
        status: IHostOnboardingState.AwaitingChanges,
        issues: [],
        data: {
          members_to_add: null,
        },
      },
      [HostOnboardingStep.SubscriptionConfiguration]: {
        status: IHostOnboardingState.AwaitingChanges,
        issues: [],
        data: {
          tier: null,
        },
      },
    };
  }

  toFull(): IHostOnboardingProcess {
    return {
      _id: this._id,
      status: this.status,
      last_modified: this.last_modified,
      last_modified_by: this.last_modified_by.toStub(),
      started_at: this.started_at,
      completed_at: this.completed_at,
      steps: this.steps,
      version: this.version,
    };
  }

  async setLastUpdated(updater: User) {
    this.last_modified_by = updater;
    this.last_modified = Math.floor(Date.now() / 1000);
  }

  async updateStep<T extends object>(stepIdx: HostOnboardingStep, updates: Partial<T>): Promise<IOnboardingStep<any>> {
    const validationResult = await stepValidators[stepIdx](updates);
    if (validationResult.length) throw validationResult;

    Object.entries(updates).forEach(([k, v]: [string, any]) => {
      (<any>this.steps[stepIdx].data)[k] = v ?? (<any>this.steps[stepIdx].data)[k];
    });

    return this.steps[stepIdx];
  }
}

const stepValidators: { [index in HostOnboardingStep]: (d: any) => Promise<IFormErrorField[]> } = {
  [HostOnboardingStep.ProofOfBusiness]: async (d: IOnboardingProofOfBusiness) => {
    return await validateObject(
      d,
      {
        business_address: (v) =>
          v.custom(async (i) => {
            throw await validators.IAddressValidator(i, true);
          }),
        business_contact_number: (v) => v.isMobilePhone('en-GB'),
        hmrc_company_number: (v) => v.isLength({ min: 8, max: 8 }),
      },
      true
    );
  },
  [HostOnboardingStep.OwnerDetails]: async (d: IOnboardingOwnerDetails) => {
    return await validators.IPersonInfoValidator(d.owner_info, true);
  },
  [HostOnboardingStep.AddMembers]: async (d: IOnboardingAddMembers) => {
    return (await Promise.all([d.members_to_add.map((m) => validators.IHostMemberChangeRequestValidator(m))])).flat();
  },
  [HostOnboardingStep.SocialPresence]: async (d: IOnboardingSocialPresence) => {
    return await validateObject(
      d.social_info,
      {
        linkedin_url: (v) => v.optional().isString(),
        facebook_url: (v) => v.optional().isString(),
        instagram_url: (v) => v.optional().isString(),
      },
      true
    );
  },
  [HostOnboardingStep.SubscriptionConfiguration]: async (d: IOnboardingSubscriptionConfiguration) => {
    return await validateObject(d, {
      tier: (v) => v.isIn(Object.values(HostSubscriptionLevel)),
    });
  },
};
