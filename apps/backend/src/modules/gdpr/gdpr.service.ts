import { Consentable, POSTGRES_PROVIDER, UserStageUpMarketingConsent } from '@core/api';
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
}
