import { Host, User, Performance } from '@core/api';
import {
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
    user: User,
    termsAndConditions: Consentable<'general_toc'>,
    privacyPolicy: Consentable<'privacy_policy'>
  ) {
    super();
    this.soft_opt_in = softOptIn;
    this.host = host;
    this.user = user;
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

  @RelationId((consent: UserHostMarketingConsent) => consent.user) user__id: NUUID;
  @ManyToOne(() => User) @JoinColumn() user: User;

  toFull(): Required<IUserHostMarketingConsent> {
    return {
      ...super.toConsent(),
      host: this.host.toStub(),
      user: this.user.toStub(),
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
  constructor(
    user: User,
    termsAndConditions: Consentable<'general_toc'>,
    privacyPolicy: Consentable<'privacy_policy'>
  ) {
    super();
    this.user = user;
    this.terms_and_conditions = termsAndConditions;
    this.privacy_policy = privacyPolicy;
  }

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
      ...super.toConsent()
    };
  }
}

@ChildEntity()
export class UserPerformanceUploadConsent
  extends UserConsent<'upload_consent'>
  implements IUserPerformanceUploadConsent {
  constructor(termsAndConditions: Consentable<'uploaders_toc'>, host: Host, performance: Performance) {
    super();
    this.terms_and_conditions = termsAndConditions;
    this.host = host;
    this.performance = performance;
  }

  @RelationId((consent: UserPerformanceUploadConsent) => consent.terms_and_conditions) terms_and_conditions__id: NUUID;
  @ManyToOne(() => Consentable) @JoinColumn() terms_and_conditions: Consentable<'uploaders_toc'>;

  @RelationId((consent: UserPerformanceUploadConsent) => consent.performance) performance__id: NUUID;
  @ManyToOne(() => Performance) @JoinColumn() performance: Performance;

  @RelationId((consent: UserPerformanceUploadConsent) => consent.host) host__id: NUUID;
  @ManyToOne(() => Host) @JoinColumn() host: Host;

  toFull(): Required<IUserPerformanceUploadConsent> {
    return {
      ...super.toConsent(),
      terms_and_conditions: this.terms_and_conditions,
      host: this.host.toStub(),
      performance: this.performance.toStub()
    };
  }
}
