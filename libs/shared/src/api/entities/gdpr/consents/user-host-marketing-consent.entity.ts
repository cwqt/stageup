import { Host, User } from '@core/api';
import { ConsentOpt, ConsentOpts, IUserHostMarketingConsent, NUUID } from '@core/interfaces';
import { ChildEntity, Column, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import { Consent } from '../consent.entity';
import { Consentable } from '../consentable.entity';

@ChildEntity()
export class UserHostMarketingConsent extends Consent<'host_marketing'> implements IUserHostMarketingConsent {
  @Column('enum', { enum: ConsentOpts }) opt_status: ConsentOpt;

  @RelationId((consent: UserHostMarketingConsent) => consent.privacy_policy) privacy_policy__id: NUUID;
  @ManyToOne(() => Consentable) @JoinColumn() privacy_policy: Consentable<'privacy_policy'>;

  @RelationId((consent: UserHostMarketingConsent) => consent.host) host__id: NUUID;
  @ManyToOne(() => Host) @JoinColumn() host: Host;

  @RelationId((consent: UserHostMarketingConsent) => consent.user) user__id: NUUID;
  @ManyToOne(() => User) @JoinColumn() user: User;

  constructor(
    opt: ConsentOpt,
    host: Host,
    user: User,
    termsAndConditions: Consentable<'general_toc'>,
    privacyPolicy: Consentable<'privacy_policy'>
  ) {
    super('host_marketing', termsAndConditions);
    this.opt_status = opt;
    this.host = host;
    this.user = user;
    this.privacy_policy = privacyPolicy;
  }

  toFull(): Required<IUserHostMarketingConsent> {
    return {
      ...super.toConsent(),
      host: this.host.toStub(),
      user: this.user.toStub(),
      privacy_policy: this.privacy_policy,
      opt_status: this.opt_status
    };
  }
}
