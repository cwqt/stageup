import {
  BaseEntity,
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn
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
  IOnboardingStepMap,
} from '@core/interfaces';

import { Host } from '../hosts/host.entity'
import { User } from '../users/user.entity';
import { Validators, object, single, array } from '@core/shared/api';
import { timestamp, uuid } from '@core/shared/helpers';
import { OnboardingReview } from './onboarding-review.entity';

@Entity()
export class Onboarding extends BaseEntity implements IHostOnboardingProcess {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() { this._id = uuid() }

  @Column('enum', { enum: HostOnboardingState }) state: HostOnboardingState;
  @Column() created_at: number;
  @Column({ nullable: true }) completed_at: number;
  @Column({ nullable: true }) last_modified: number;
  @Column({ nullable: true }) last_submitted: number;
  @Column() version: number;
  @Column('jsonb', { nullable: true }) steps: IOnboardingStepMap;
  
  @OneToMany(() => OnboardingReview, osr => osr.onboarding, { eager: true }) reviews: OnboardingReview[];
  @OneToOne(() => Host, host => host.onboarding_process, { eager: true }) @JoinColumn() host: Host;
  @OneToOne(() => User, { eager: true }) @JoinColumn() last_modified_by: User;

  constructor(host: Host, creator: User) {
    super();
    this.last_modified_by = creator;
    this.host = host;

    this.state = HostOnboardingState.AwaitingChanges;
    this.created_at = timestamp(new Date());
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
          business_address: null
        }
      },
      [HostOnboardingStep.OwnerDetails]: {
        valid: false,
        state: HostOnboardingState.AwaitingChanges,
        data: {
          owner_info: {
            title: null,
            first_name: null,
            last_name: null
          }
        }
      },
      [HostOnboardingStep.SocialPresence]: {
        valid: false,
        state: HostOnboardingState.AwaitingChanges,
        data: {
          social_info: {
            facebook_url: null,
            linkedin_url: null,
            instagram_url: null
          }
        }
      },
      [HostOnboardingStep.AddMembers]: {
        valid: false,
        state: HostOnboardingState.AwaitingChanges,
        data: {
          members_to_add: []
        }
      },
      [HostOnboardingStep.SubscriptionConfiguration]: {
        valid: false,
        state: HostOnboardingState.AwaitingChanges,
        data: {
          tier: null
        }
      }
    };
  }

  
  toFull(): Required<IHostOnboarding> {
    const lastReview = this.reviews?.find(r => r.onboarding_version == this.version);

    return {
      _id: this._id,
      state: this.state,
      last_submitted: this.last_submitted,
      last_modified: this.last_modified,
      last_modified_by: this.last_modified_by.toStub(),
      last_reviewed: lastReview?.reviewed_at,
      last_reviewed_by: lastReview?.reviewed_by.toStub(),
      created_at: this.created_at,
      completed_at: this.completed_at,
      version: this.version,
      host: this.host.toStub(),
      steps: Object.keys(this.steps).reduce<IHostOnboarding['steps']>(
        (acc, curr: unknown) => {
          const stepIndex = curr as HostOnboardingStep;
          acc[stepIndex] = this.steps[stepIndex].state;
          return acc;
        },
        {
          [0]: null,
          [1]: null,
          [2]: null,
          [3]: null,
          [4]: null
        }
      )
    };
  }

  // TODO: cascade delete all reviews & onboarding process post enact
  // async delete(txc: EntityManager) {}

  async setLastUpdated(updater: User) {
    this.last_modified_by = updater;
    this.last_modified = Math.floor(Date.now() / 1000);
  }

  async updateStep<T extends object>(
    stepIndex: HostOnboardingStep,
    updates: Partial<T>
  ): Promise<IOnboardingStep<unknown>> {
    const validationResult = await stepValidators[stepIndex](updates);
    if (validationResult.length > 0) {
      this.steps[stepIndex].valid = false;
      throw validationResult;
    } else {
      // Data fully valid, so is the step - as a consequence we can't partially update fields
      // but i doubt we'll need that since each step is quite small
      this.steps[stepIndex].valid = true;
    }

    Object.entries(updates).forEach(([k, v]: [string, unknown]) => {
      (this.steps[stepIndex].data as unknown)[k] = v ?? (this.steps[stepIndex].data as unknown)[k];
    });

    return this.steps[stepIndex];
  }
}

const stepValidators: { [index in HostOnboardingStep]: (d: unknown) => Promise<IFormErrorField[]> } = {
  [HostOnboardingStep.ProofOfBusiness]: async (d: IOnboardingProofOfBusiness) => {
    return await object(d, {
      hmrc_company_number: v => v.optional({ checkFalsy: true }).isInt().isLength({ min: 8, max: 8 }),
      business_contact_number: v => v.isMobilePhone('any'),//TODO: en-GB locale
      business_address: v => v.custom(single(Validators.Objects.IAddress())),
    });
  },
  [HostOnboardingStep.OwnerDetails]: async (d: IOnboardingOwnerDetails) => {
    return object(d, {
      owner_info: v => v.custom(single(Validators.Objects.IPersonInfo()))
    });
  },
  [HostOnboardingStep.AddMembers]: async (d: IOnboardingAddMembers) => {
    return object(d, {
      members_to_add: v => v.custom(array(Validators.Objects.IHostMemberChangeRequest()))
    });
  },
  [HostOnboardingStep.SocialPresence]: async (d: IOnboardingSocialPresence) => {
    return object(d, { social_info: v => v.custom(single(Validators.Objects.ISocialInfo()))});
  },
  [HostOnboardingStep.SubscriptionConfiguration]: async (d: IOnboardingSubscriptionConfiguration) => {
    return object(d, {
      tier: v => Validators.Fields.isInt(v).isIn(Object.values(HostSubscriptionLevel))
    });
  }
};

