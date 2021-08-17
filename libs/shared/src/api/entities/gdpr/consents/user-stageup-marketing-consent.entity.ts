import { User } from '@core/api';
import { IUserStageUpMarketingConsent, NUUID, ConsentOpts, SuConsentOpt } from '@core/interfaces';
import { ChildEntity, JoinColumn, ManyToOne, RelationId, Column } from 'typeorm';
import { Consent } from '../consent.entity';
import { Consentable } from '../consentable.entity';

@ChildEntity()
export class UserStageUpMarketingConsent extends Consent<'stageup_marketing'> implements IUserStageUpMarketingConsent {
  constructor(
    opt: SuConsentOpt,
    user: User,
    termsAndConditions: Consentable<'general_toc'>,
    privacyPolicy: Consentable<'privacy_policy'>
  ) {
    super('stageup_marketing');
    this.opt_status = opt;
    this.user = user;
    this.terms_and_conditions = termsAndConditions;
    this.privacy_policy = privacyPolicy;
  }

  @Column('enum', { enum: ConsentOpts }) opt_status: SuConsentOpt;

  @RelationId((consent: UserStageUpMarketingConsent) => consent.terms_and_conditions) terms_and_conditions__id: NUUID;
  @ManyToOne(() => Consentable) @JoinColumn() terms_and_conditions: Consentable<'general_toc'>;

  @RelationId((consent: UserStageUpMarketingConsent) => consent.privacy_policy) privacy_policy__id: NUUID;
  @ManyToOne(() => Consentable) @JoinColumn() privacy_policy: Consentable<'privacy_policy'>;

  @RelationId((consent: UserStageUpMarketingConsent) => consent.user) user__id: NUUID;
  @ManyToOne(() => User) @JoinColumn() user: User;

  toFull(): Required<IUserStageUpMarketingConsent> {
    return {
      user: this.user.toStub(),
      privacy_policy: this.privacy_policy,
      terms_and_conditions: this.terms_and_conditions,
      opt_status: this.opt_status,
      ...super.toConsent()
    };
  }
}
