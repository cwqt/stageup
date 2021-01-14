import {
  BaseEntity,
  Column,
  Entity,
  EntityManager,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  HostOnboardingStep,
  HostSubscriptionLevel,
  IFormErrorField,
  IHostOnboarding,
  IHostOnboardingProcess,
  HostOnboardingState,
  IOnboardingAddMembers,
  IOnboardingOwnerDetails,
  IOnboardingProofOfBusiness,
  IOnboardingSocialPresence,
  IOnboardingStep,
  IOnboardingSubscriptionConfiguration,
} from '@eventi/interfaces';
import { Host } from '../Hosts/Host.model';
import { User } from '../Users/User.model';
import { object, single, array } from '../../common/validate';
import Validators from '../../common/validate';
import { unixTimestamp } from '../../common/helpers';
import { OnboardingStepReview } from './OnboardingStepReview.model';

@Entity()
export class HostOnboardingProcess extends BaseEntity implements IHostOnboardingProcess {
  @PrimaryGeneratedColumn() _id: number;
  @Column() state: HostOnboardingState;
  @Column() created_at: number;
  @Column({ nullable: true }) completed_at: number;
  @Column({ nullable: true }) last_modified: number;
  @Column({ nullable: true }) last_submitted: number;
  @Column() version: number;
  @Column('jsonb', { nullable: true }) steps: {
    [HostOnboardingStep.ProofOfBusiness]: IOnboardingStep<IOnboardingProofOfBusiness>;
    [HostOnboardingStep.OwnerDetails]: IOnboardingStep<IOnboardingOwnerDetails>;
    [HostOnboardingStep.SocialPresence]: IOnboardingStep<IOnboardingSocialPresence>;
    [HostOnboardingStep.AddMembers]: IOnboardingStep<IOnboardingAddMembers>;
    [HostOnboardingStep.SubscriptionConfiguration]: IOnboardingStep<IOnboardingSubscriptionConfiguration>;
  };

  @OneToMany(() => OnboardingStepReview, osr => osr.onboarding) reviews: OnboardingStepReview[];
  @OneToOne(() => Host, host => host.onboarding_process, { eager: true }) @JoinColumn() host: Host;
  @OneToOne(() => User, { eager: true }) @JoinColumn() last_modified_by: User;

  constructor(host: Host, creator: User) {
    super();
    this.last_modified_by = creator;
    this.host = host;

    this.state = HostOnboardingState.AwaitingChanges;
    this.created_at = unixTimestamp(new Date());
    this.last_modified = this.created_at;
    this.version = 0;
    this.reviews = [];

    this.steps = {
      [HostOnboardingStep.ProofOfBusiness]: {
        valid: false,
        state: HostOnboardingState.AwaitingChanges,
        data: {
          hmrc_company_number: null,
          business_contact_number: null,
          business_address: null,
        },
      },
      [HostOnboardingStep.OwnerDetails]: {
        valid: false,
        state: HostOnboardingState.AwaitingChanges,
        data: {
          owner_info: {
            title: null,
            first_name: null,
            last_name: null,
          },
        },
      },
      [HostOnboardingStep.SocialPresence]: {
        valid: false,
        state: HostOnboardingState.AwaitingChanges,
        data: {
          social_info: {
            facebook_url: null,
            linkedin_url: null,
            instagram_url: null,
          },
        },
      },
      [HostOnboardingStep.AddMembers]: {
        valid: false,
        state: HostOnboardingState.AwaitingChanges,
        data: {
          members_to_add: [],
        },
      },
      [HostOnboardingStep.SubscriptionConfiguration]: {
        valid: false,
        state: HostOnboardingState.AwaitingChanges,
        data: {
          tier: null,
        },
      },
    };
  }

  // toSteps(): IOnboardingStepMap {
  //   return  {
  //     [HostOnboardingStep.ProofOfBusiness]: IOnboardingStep<IOnboardingProofOfBusiness>;
  //     [HostOnboardingStep.OwnerDetails]: IOnboardingStep<IOnboardingOwnerDetails>;
  //     [HostOnboardingStep.SocialPresence]: IOnboardingStep<IOnboardingSocialPresence>;
  //     [HostOnboardingStep.AddMembers]: IOnboardingStep<IOnboardingAddMembers>;
  //     [HostOnboardingStep.SubscriptionConfiguration]: IOnboardingStep<IOnboardingSubscriptionConfiguration>;
  //   }
  // }

  toFull(): Required<IHostOnboarding> {
    return {
      _id: this._id,
      state: this.state,
      last_modified: this.last_modified,
      last_modified_by: this.last_modified_by.toStub(),
      last_submitted: this.last_submitted,
      created_at: this.created_at,
      completed_at: this.completed_at,
      version: this.version,
      host: this.host.toStub(),
      steps: Object.keys(this.steps).reduce((acc, curr) => {
        let stepIdx = (curr as unknown) as HostOnboardingStep;
        acc[stepIdx] = this.steps[stepIdx].state;
        return acc;
      }, {} as IHostOnboarding['steps']),
    };
  }

  // TODO: cascade delete all reviews & onboarding process post enact
  async delete(txc:EntityManager) {}

  async setLastUpdated(updater: User) {
    this.last_modified_by = updater;
    this.last_modified = Math.floor(Date.now() / 1000);
  }

  async updateStep<T extends object>(stepIdx: HostOnboardingStep, updates: Partial<T>): Promise<IOnboardingStep<any>> {
    const validationResult = await stepValidators[stepIdx](updates);
    if (validationResult.length) {
      this.steps[stepIdx].valid = false;
      throw validationResult;
    } else {
      // data fully valid, so is the step - as a consequence we can't partially update fields
      // but i doubt we'll need that since each step is quite small
      this.steps[stepIdx].valid = true;
    }

    Object.entries(updates).forEach(([k, v]: [string, any]) => {
      (<any>this.steps[stepIdx].data)[k] = v ?? (<any>this.steps[stepIdx].data)[k];
    });

    return this.steps[stepIdx];
  }
}

const stepValidators: { [index in HostOnboardingStep]: (d: any) => Promise<IFormErrorField[]> } = {
  [HostOnboardingStep.ProofOfBusiness]: async (d: IOnboardingProofOfBusiness) => {
    return await object(d, {
      hmrc_company_number: v => v.optional({ checkFalsy: true }).isInt().isLength({ min: 8, max: 8 }),
      business_contact_number: v => v.isMobilePhone('any'),//TODO: en-GB locale
      business_address: v => v.custom(single(Validators.Objects.IAddress())),
    });
  },
  [HostOnboardingStep.OwnerDetails]: async (d: IOnboardingOwnerDetails) => {
    return await object(d, {
      owner_info: v => v.custom(single(Validators.Objects.IPersonInfo())),
    });
  },
  [HostOnboardingStep.AddMembers]: async (d: IOnboardingAddMembers) => {
    return await object(d, {
      members_to_add: v => v.custom(array(Validators.Objects.IHostMemberChangeRequest())),
    });
  },
  [HostOnboardingStep.SocialPresence]: async (d: IOnboardingSocialPresence) => {
    return await object(d, {
      social_info: v =>
        v.custom(
          single<typeof d.social_info>({
            linkedin_url: v => Validators.Fields.isString(v),
            facebook_url: v => Validators.Fields.isString(v),
            instagram_url: v => Validators.Fields.isString(v),
          })
        ),
    });
  },
  [HostOnboardingStep.SubscriptionConfiguration]: async (d: IOnboardingSubscriptionConfiguration) => {
    return await object(d, {
      tier: v => Validators.Fields.isInt(v).isIn(Object.values(HostSubscriptionLevel)),
    });
  },
};
