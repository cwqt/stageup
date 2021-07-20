import { Host } from '@core/api';
import {
  IUserCookiesConsent,
  IUserHostMarketingConsent,
  IUserPerformanceUploadConsent,
  IUserStageUpMarketingConsent,
  NUUID
} from '@core/interfaces';
import { ChildEntity, Column, JoinColumn, JoinTable, ManyToOne, RelationId } from 'typeorm';
import { Consentable } from './consentable.entity';
import { UserConsent } from './user-consent.entity';

@ChildEntity()
export class UserHostMarketingConsent extends UserConsent<'host_marketing'> implements IUserHostMarketingConsent {
  constructor(
    softOptIn: boolean,
    host: Host,
    termsAndConditions: Consentable<'general_toc'>,
    privacyPolicy: Consentable<'privacy_policy'>
  ) {
    super();
    this.soft_opt_in = softOptIn;
    this.host = host;
    this.terms_and_conditions = termsAndConditions;
    this.privacy_policy = privacyPolicy;
  }

  @Column() soft_opt_in: boolean;

  @RelationId((consent: UserHostMarketingConsent) => consent.terms_and_conditions) terms_and_conditions__id: NUUID;
  @ManyToOne(() => Consentable) @JoinColumn() terms_and_conditions: Consentable<'general_toc'>;

  @RelationId((consent: UserHostMarketingConsent) => consent.privacy_policy) privacy_policy__id: NUUID;
  @ManyToOne(() => Consentable) @JoinColumn() privacy_policy: Consentable<'privacy_policy'>;

  @RelationId((consent: UserHostMarketingConsent) => consent.host) host__id: NUUID;
  @ManyToOne(() => Host) @JoinColumn() host: Host;

  toFull(): Required<IUserHostMarketingConsent> {
    return {
      ...super.toConsent(),
      host: this.host.toStub(),
      privacy_policy: this.privacy_policy,
      terms_and_conditions: this.terms_and_conditions,
      soft_opt_in: this.soft_opt_in
    };
  }
}

@ChildEntity()
export class UserStageUpMarketingConsent
  extends UserConsent<'stageup_marketing'>
  implements IUserStageUpMarketingConsent {
  constructor() {
    super();
  }

  toFull(): Required<IUserStageUpMarketingConsent> {
    return {
      ...this.toConsent()
    };
  }
}

@ChildEntity()
export class UserCookieConsent extends UserConsent<'cookies'> implements IUserCookiesConsent {
  constructor(ipAddress: string) {
    super();
    this.ip_address = ipAddress;
  }

  @Column('inet', { nullable: true }) ip_address: string;

  toFull(): Required<IUserCookiesConsent> {
    return {
      ...super.toConsent(),
      ip_address: this.ip_address
    };
  }
}

@ChildEntity()
export class UserPerformanceUploadConsent
  extends UserConsent<'upload_consent'>
  implements IUserPerformanceUploadConsent {
  constructor(termsAndConditions: Consentable<'uploaders_toc'>) {
    super();
    this.terms_and_conditions = termsAndConditions;
  }

  @RelationId((consent: UserPerformanceUploadConsent) => consent.terms_and_conditions) terms_and_conditions__id: NUUID;
  @ManyToOne(() => Consentable) @JoinColumn() terms_and_conditions: Consentable<'uploaders_toc'>;

  toFull(): Required<IUserPerformanceUploadConsent> {
    return {
      ...super.toConsent(),
      terms_and_conditions: this.terms_and_conditions
    };
  }
}
