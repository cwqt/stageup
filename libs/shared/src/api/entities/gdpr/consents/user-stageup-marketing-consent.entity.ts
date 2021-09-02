import { User } from '@core/api';
import { IUserStageUpMarketingConsent, NUUID } from '@core/interfaces';
import { ChildEntity, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import { Consent } from '../consent.entity';
import { Consentable } from '../consentable.entity';

@ChildEntity()
export class UserStageUpMarketingConsent extends Consent<'stageup_marketing'> implements IUserStageUpMarketingConsent {
  constructor(
    user: User,
    termsAndConditions: Consentable<'general_toc'>,
    privacyPolicy: Consentable<'privacy_policy'>
  ) {
    super('stageup_marketing', termsAndConditions);
    this.user = user;
    this.terms_and_conditions = termsAndConditions;
    this.privacy_policy = privacyPolicy;
  }

  @RelationId((consent: UserStageUpMarketingConsent) => consent.privacy_policy) privacy_policy__id: NUUID;
  @ManyToOne(() => Consentable) @JoinColumn() privacy_policy: Consentable<'privacy_policy'>;

  @RelationId((consent: UserStageUpMarketingConsent) => consent.user) user__id: NUUID;
  @ManyToOne(() => User) @JoinColumn() user: User;

  toFull(): Required<IUserStageUpMarketingConsent> {
    return {
      user: this.user.toStub(),
      privacy_policy: this.privacy_policy,
      ...super.toConsent()
    };
  }
}
