import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
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

@Entity()
export class HostOnboardingProcess extends BaseEntity implements IHostOnboardingProcess {
  @PrimaryGeneratedColumn()   _id: number;
  @Column()                   status: IHostOnboardingState;
  @Column()                   started_at: number;
  @Column({nullable: true})   completed_at: number;
  @Column('jsonb') steps: {
    [HostOnboardingStep.ProofOfBusiness]: IOnboardingStep<IOnboardingProofOfBusiness>;
    [HostOnboardingStep.OwnerDetails]: IOnboardingStep<IOnboardingOwnerDetails>;
    [HostOnboardingStep.SocialPresence]: IOnboardingStep<IOnboardingSocialPresence>;
    [HostOnboardingStep.AddMembers]: IOnboardingStep<IOnboardingAddMembers>;
    [HostOnboardingStep.SubscriptionConfiguration]: IOnboardingStep<IOnboardingSubscriptionConfiguration>;
  };

  constructor() {
    super();
    this.status = IHostOnboardingState.Pending;
    this.started_at
  }
}
