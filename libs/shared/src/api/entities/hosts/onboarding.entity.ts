import { Validators } from '@core/api';
import { timestamp, uuid } from '@core/helpers';
import {
  HostOnboardingState,
  HostOnboardingStep,
  IHostOnboarding,
  IHostOnboardingProcess,
  IOnboardingStep,
  IOnboardingStepMap
} from '@core/interfaces';
import { Struct, StructError } from 'superstruct';
import { BaseEntity, BeforeInsert, Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { Host } from '../hosts/host.entity';
import { User } from '../users/user.entity';
import { OnboardingReview } from './onboarding-review.entity';

@Entity()
export class Onboarding extends BaseEntity implements IHostOnboardingProcess {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() {
    this._id = uuid();
  }

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
          business_address: null,
          business_type: null,
          vat_number: null
        }
      },
      [HostOnboardingStep.OwnerDetails]: {
        valid: false,
        state: HostOnboardingState.AwaitingChanges,
        data: {
          title: null,
          first_name: null,
          last_name: null
        }
      },
      [HostOnboardingStep.SocialPresence]: {
        valid: false,
        state: HostOnboardingState.AwaitingChanges,
        data: {
          site_url: null,
          facebook_url: null,
          linkedin_url: null,
          instagram_url: null
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
          [HostOnboardingStep.ProofOfBusiness]: null,
          [HostOnboardingStep.OwnerDetails]: null,
          [HostOnboardingStep.SocialPresence]: null
        }
      )
    };
  }

  async setLastUpdated(updater: User) {
    this.last_modified_by = updater;
    this.last_modified = Math.floor(Date.now() / 1000);
  }

  async updateStep<T extends object>(
    stepIndex: HostOnboardingStep,
    updates: Partial<T>
  ): Promise<IOnboardingStep<unknown> | StructError> {
    try {
      stepValidators[stepIndex].assert(updates);
      this.steps[stepIndex].valid = true;
    } catch (error) {
      this.steps[stepIndex].valid = false;
      throw error;
    }

    Object.entries(updates).forEach(([k, v]: [string, unknown]) => {
      (this.steps[stepIndex].data as unknown)[k] = v ?? (this.steps[stepIndex].data as unknown)[k];
    });

    this.steps[stepIndex].state = HostOnboardingState.Modified;

    return this.steps[stepIndex];
  }
}

const stepValidators: { [index in HostOnboardingStep]: Struct<IOnboardingStepMap[index]['data']> } = {
  [HostOnboardingStep.ProofOfBusiness]: Validators.Objects.IHostBusinessDetails,
  [HostOnboardingStep.OwnerDetails]: Validators.Objects.IPersonInfo,
  [HostOnboardingStep.SocialPresence]: Validators.Objects.ISocialInfo
};
