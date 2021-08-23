import { Host, Performance } from '@core/api';
import { IHostUploadersConsent, NUUID } from '@core/interfaces';
import { ChildEntity, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import { Consent } from '../consent.entity';
import { Consentable } from '../consentable.entity';

@ChildEntity()
export class UploadersConsent extends Consent<'upload_consent'> implements IHostUploadersConsent {
  constructor(termsAndConditions: Consentable<'general_toc'>, host: Host, performance: Performance) {
    super('upload_consent', termsAndConditions);
    this.host = host;
    this.performance = performance;
  }

  @RelationId((consent: UploadersConsent) => consent.performance) performance__id: NUUID;
  @ManyToOne(() => Performance) @JoinColumn() performance: Performance;

  @RelationId((consent: UploadersConsent) => consent.host) host__id: NUUID;
  @ManyToOne(() => Host) @JoinColumn() host: Host;

  toFull(): Required<IHostUploadersConsent> {
    return {
      ...super.toConsent(),
      host: this.host.toStub(),
      performance: this.performance.toStub()
    };
  }
}
