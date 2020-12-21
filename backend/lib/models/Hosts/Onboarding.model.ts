import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import {
  HostOnboardingStep,
  IHostOnboardingProcess,
  IHostOnboardingState,
  IOnboardingAddMembers,
  IOnboardingOwnerDetails,
  IOnboardingProofOfBusiness,
  IOnboardingSocialPresence,
  IOnboardingStep,
  IOnboardingSubscriptionConfiguration,
} from '@eventi/interfaces';
import { Host } from '../Hosts/Host.model';
import { User } from '../Users/User.model';

@Entity()
export class HostOnboardingProcess extends BaseEntity implements IHostOnboardingProcess {
  @PrimaryGeneratedColumn()   _id: number;
  @Column()                   status: IHostOnboardingState;
  @Column()                   started_at: number;
  @Column({nullable: true})   completed_at: number;
  @Column({nullable: true})   last_modified: number;
  @Column('jsonb', { nullable:true }) steps: {
    [HostOnboardingStep.ProofOfBusiness]: IOnboardingStep<IOnboardingProofOfBusiness>;
    [HostOnboardingStep.OwnerDetails]: IOnboardingStep<IOnboardingOwnerDetails>;
    [HostOnboardingStep.SocialPresence]: IOnboardingStep<IOnboardingSocialPresence>;
    [HostOnboardingStep.AddMembers]: IOnboardingStep<IOnboardingAddMembers>;
    [HostOnboardingStep.SubscriptionConfiguration]: IOnboardingStep<IOnboardingSubscriptionConfiguration>;
  };

  @OneToOne(() => Host, host => host.onboarding_process) @JoinColumn() host:Host;
  @OneToOne(() => User, { eager: true }) @JoinColumn()                 last_modified_by: User;

  constructor(host:Host, creator:User) {
    super();
    this.status = IHostOnboardingState.AwaitingChanges;
    this.started_at = Math.floor(Date.now() / 1000);//timestamp in seconds
    this.last_modified = this.started_at;
    this.last_modified_by = creator;
    this.host = host;

    this.steps = {
      [HostOnboardingStep.ProofOfBusiness]: {
        status: IHostOnboardingState.AwaitingChanges,
        issues: [],
        data: {
          hmrc_company_number: null,
          business_contact_number: null,
          business_address: null
        },
      },
      [HostOnboardingStep.OwnerDetails]: {
        status: IHostOnboardingState.AwaitingChanges,
        issues: [],
        data: {
          owner_info: null
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
          members_to_add: null
        },
      },
      [HostOnboardingStep.SubscriptionConfiguration]: {
        status: IHostOnboardingState.AwaitingChanges,
        issues: [],
        data: {
          tier: null
        },
      }  
    }
  }

  toFull():IHostOnboardingProcess {
    return {
      _id: this._id,
      status: this.status,
      last_modified: this.last_modified,
      last_modified_by: this.last_modified_by.toStub(),
      started_at: this.started_at,
      completed_at: this.completed_at,
      steps: this.steps
    }
  }
}
