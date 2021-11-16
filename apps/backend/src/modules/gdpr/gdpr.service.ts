import {
  Consentable,
  Host,
  Performance,
  POSTGRES_PROVIDER,
  UploadersConsent,
  UserStageUpMarketingConsent
} from '@core/api';
import { ConsentableType } from '@core/interfaces';
import { Inject, Service } from 'typedi';
import { ModuleService } from '@core/api';
import { Connection } from 'typeorm';

@Service()
export class GdprService extends ModuleService {
  constructor(@Inject(POSTGRES_PROVIDER) private ORM: Connection) {
    super();
  }

  async readConsentable<T extends ConsentableType>(type: T, version: number | 'latest'): Promise<Consentable<T>> {
    return Consentable.retrieve({ type: type }, version);
  }

  async readUserPlatformConsent(userId: string): Promise<UserStageUpMarketingConsent> {
    return await this.ORM.createQueryBuilder(UserStageUpMarketingConsent, 'consent')
      .where('consent.user__id = :uid', { uid: userId })
      .getOne();
  }

  async addHostUploadConsent(host: Host, performance: Performance): Promise<void> {
    const toc = await Consentable.retrieve({ type: 'general_toc' }, 'latest');

    await this.ORM.transaction(async txc => {
      const consent = new UploadersConsent(toc, host, performance);
      txc.save(consent);
    });
  }

  async readHostUploadConsent(host: Host, performance: Performance): Promise<UploadersConsent> {
    return this.ORM.createQueryBuilder(UploadersConsent, 'consent')
      .where('consent.host__id = :hid', { hid: host._id })
      .andWhere('consent.performance__id = :pid', { pid: performance._id })
      .getOne();
  }
}
