import { Host, Performance } from '@core/api';
import { IHostUploadersConsent, NUUID } from '@core/interfaces';
import { ChildEntity, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import { Consent } from '../consent.entity';
import { Consentable } from '../consentable.entity';

@ChildEntity()
export class UploadersConsent extends Consent<'upload_consent'> implements IHostUploadersConsent {
  constructor(termsAndConditions: Consentable<'uploaders_toc'>, host: Host, performance: Performance) {
    super('upload_consent');
    this.terms_and_conditions = termsAndConditions;
    this.host = host;
    this.performance = performance;
  }

  @RelationId((consent: UploadersConsent) => consent.terms_and_conditions) terms_and_conditions__id: NUUID;
  @ManyToOne(() => Consentable) @JoinColumn() terms_and_conditions: Consentable<'uploaders_toc'>;

  @RelationId((consent: UploadersConsent) => consent.performance) performance__id: NUUID;
  @ManyToOne(() => Performance) @JoinColumn() performance: Performance;

  @RelationId((consent: UploadersConsent) => consent.host) host__id: NUUID;
  @ManyToOne(() => Host) @JoinColumn() host: Host;

  toFull(): Required<IHostUploadersConsent> {
    return {
      ...super.toConsent(),
      terms_and_conditions: this.terms_and_conditions,
      host: this.host.toStub(),
      performance: this.performance.toStub()
    };
  }
}
