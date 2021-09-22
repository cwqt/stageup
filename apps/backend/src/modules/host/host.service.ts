import { ConsentableType, IUserConsent, ConsentType } from '@core/interfaces';
import { Inject, Service } from 'typedi';
import { ModuleService } from '@core/api';
import { Connection } from 'typeorm';
import { POSTGRES_PROVIDER, UserHostMarketingConsent } from '@core/api';

@Service()
export class HostService extends ModuleService {
  constructor(@Inject(POSTGRES_PROVIDER) private ORM: Connection) {
    super();
  }

  async readHostMarketingLastUpdate(hostId: string): Promise<IUserConsent<'host_marketing'>['saved_at']> {
    const latestConsent = await this.ORM.createQueryBuilder(UserHostMarketingConsent, 'consent')
      .where('consent.host__id = :host_id', { host_id: hostId })
      .orderBy('consent.saved_at', 'DESC') // so we get most recently updated entries at the top
      .getOne();
    return latestConsent.saved_at;
  }
}
