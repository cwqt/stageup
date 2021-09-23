import { User } from '@core/api';
import { IUserStageUpMarketingConsent, NUUID, ConsentOpts, PlatformConsentOpt } from '@core/interfaces';
import { ChildEntity, JoinColumn, ManyToOne, RelationId, Column } from 'typeorm';
import { Consent } from '../consent.entity';
import { Consentable } from '../consentable.entity';
import { timestamp } from '@core/helpers';

@ChildEntity()
export class UserStageUpMarketingConsent extends Consent<'stageup_marketing'> implements IUserStageUpMarketingConsent {
  constructor(
    opt: PlatformConsentOpt,
    user: User,
    termsAndConditions: Consentable<'general_toc'>,
    privacyPolicy: Consentable<'privacy_policy'>
  ) {
    super('stageup_marketing', termsAndConditions);
    this.opt_status = opt;
    this.user = user;
    this.privacy_policy = privacyPolicy;
  }

  @Column('enum', { enum: ConsentOpts }) opt_status: PlatformConsentOpt;

  @RelationId((consent: UserStageUpMarketingConsent) => consent.privacy_policy) privacy_policy__id: NUUID;
  @ManyToOne(() => Consentable) @JoinColumn() privacy_policy: Consentable<'privacy_policy'>;

  @RelationId((consent: UserStageUpMarketingConsent) => consent.user) user__id: NUUID;
  @ManyToOne(() => User) @JoinColumn() user: User;

  toFull(): Required<IUserStageUpMarketingConsent> {
    return {
      user: this.user.toStub(),
      privacy_policy: this.privacy_policy,
      opt_status: this.opt_status,
      ...super.toConsent()
    };
  }

  // Sets the new status of an existing consent, using the most recent documents and with a current timestamp
  async updateStatus(status: PlatformConsentOpt): Promise<void> {
    // Update the datetime of the consent
    this.saved_at = timestamp(new Date());
    // Get the latest policies
    this.terms_and_conditions = await Consentable.retrieve({ type: 'general_toc' }, 'latest');
    this.privacy_policy = await Consentable.retrieve({ type: 'privacy_policy' }, 'latest');
    this.opt_status = status;
  }
}
