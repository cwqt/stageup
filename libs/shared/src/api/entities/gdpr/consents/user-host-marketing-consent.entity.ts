import { Host, User } from '@core/api';
import { ConsentOpt, ConsentOpts, IUserHostMarketingConsent, IUserMarketingInfo, NUUID } from '@core/interfaces';
import { ChildEntity, Column, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import { Consent } from '../consent.entity';
import { Consentable } from '../consentable.entity';
import { timestamp } from '@core/helpers';

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

  // The host will only need access to the users name/username and email and opt_status for marketing purposes
  toUserMarketingInfo(): Required<IUserMarketingInfo> {
    return {
      _id: this.user._id,
      email_address: this.user.email_address,
      name: this.user.name,
      username: this.user.username,
      opt_status: this.opt_status
    };
  }

  // Sets the new status of an existing consent, using the most recent documents and with a current timestamp
  async updateStatus(status: ConsentOpt): Promise<void> {
    // Update the datetime of the consent
    this.saved_at = timestamp();
    // Get the latest policies
    this.terms_and_conditions = await Consentable.retrieve({ type: 'general_toc' }, 'latest');
    this.privacy_policy = await Consentable.retrieve({ type: 'privacy_policy' }, 'latest');
    this.opt_status = status;
  }
}
