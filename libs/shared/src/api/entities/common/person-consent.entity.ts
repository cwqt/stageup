import {
  BaseEntity,
  Entity,
  Column,
  PrimaryColumn,
  RelationId,
  ManyToOne
} from 'typeorm';

import { Host, User, Performance, Consent } from '@core/api';
import { uuid } from '@core/helpers';
  
import {
  HostMarketingConsent,
  IPersonConsent,
  NUUID,
  PerformanceUploadConsent,
  PersonConsentType,
  SuMarketingConsent,
  UserCookieConsent,
} from '@core/interfaces';
  
  
@Entity()
export class PersonConsent<T extends PersonConsentType> extends BaseEntity implements IPersonConsent<T> {
    @PrimaryColumn('varchar') _id: NUUID;
  
    @Column() type: T;
    @Column() consent_given: boolean;
    @Column('inet', { nullable: true }) ip_address: string;

    // Many-to-Many relation
    @RelationId((personConsent: PersonConsent<T>) => personConsent.user) user__id: NUUID;
    @ManyToOne(() => User, { nullable: true }) user: User;

    @RelationId((personConsent: PersonConsent<T>) => personConsent.host) host__id: NUUID;
    @ManyToOne(() => Host, { nullable: true }) host: Host;

    @RelationId((personConsent: PersonConsent<T>) => personConsent.performance) performance__id: NUUID;
    @ManyToOne(() => Performance, { nullable: true }) performance: Performance;

    @RelationId((personConsent: PersonConsent<T>) => personConsent.terms_and_conditions) terms_and_conditions__id: NUUID;
    @ManyToOne(() => Consent, consent => consent.type =='general_toc', { nullable: true }) terms_and_conditions: Consent<'general_toc'>;

    @RelationId((personConsent: PersonConsent<T>) => personConsent.privacy_policy) privacy_policy__id: NUUID;
    @ManyToOne(() => Consent, consent => consent.type =='privacy_policy', { nullable: true }) privacy_policy: Consent<'privacy_policy'>;

    @RelationId((personConsent: PersonConsent<T>) => personConsent.cookies) cookies__id: NUUID;
    @ManyToOne(() => Consent, consent => consent.type =='cookies', { nullable: true }) cookies: Consent<'cookies'>;

    @RelationId((personConsent: PersonConsent<T>) => personConsent.uploaders_terms_and_conditions) uploaders_terms_and_conditions__id: NUUID;
    @ManyToOne(() => Consent, consent => consent.type =='uploaders_toc', { nullable: true }) uploaders_terms_and_conditions: Consent<'uploaders_toc'>;


    constructor(data) {
      super();
      this._id = uuid();
      this.type = data.type;
      this.consent_given = data.consent_given;
      this.ip_address = data.ip_address;
      this.user = data.user;
      this.host = data.host;
      this.performance = data.performance;
      this.terms_and_conditions = data.terms_and_conditions;
      this.privacy_policy = data.privacy_policy;
      this.cookies = data.cookies;
      this.uploaders_terms_and_conditions = data.uploaders_terms_and_conditions;
    }

    toSuMarketing(): Required<SuMarketingConsent> {
      return {
        _id: this._id,
        consent_given: this.consent_given,
        user__id: this.user__id,
        terms_and_conditions__id: this.terms_and_conditions__id,
        privacy_policy__id: this.privacy_policy__id,
      };
    }

    toHostMarketing(): Required<HostMarketingConsent> {
      return {
        ...this.toSuMarketing(),
        host__id: this.host__id,
      };
    }

    toCookies(): Required<UserCookieConsent> {
      return {
        _id: this._id,
        consent_given: this.consent_given,
        ip_address: this.ip_address,
        cookies__id: this.cookies__id,
      };
    }

    toUploadToc(): Required<PerformanceUploadConsent> {
      return {
        _id: this._id,
        consent_given: this.consent_given,
        uploaders_terms_and_conditions__id: this.uploaders_terms_and_conditions__id,
        performance__id: this.performance__id,
      };
    }
  }
  