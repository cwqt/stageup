import { ModuleService, Onboarding, PostgresProvider, POSTGRES_PROVIDER } from '@core/api';
import { IQueryParams } from '@core/helpers';
import { IEnvelopedData } from '@core/interfaces';
import { Inject, Service } from 'typedi';
import { Connection } from 'typeorm';

@Service()
export class AdminService extends ModuleService {
  constructor(@Inject(POSTGRES_PROVIDER) private ORM: Connection) {
    super();
  }

  readOnboardingProcesses(query: IQueryParams): Promise<IEnvelopedData<Onboarding[]>> {
    return this.ORM.createQueryBuilder(Onboarding, 'onboarding')
      .innerJoinAndSelect('onboarding.host', 'host')
      .filter(
        {
          username: { subject: 'host.username' },
          state: { subject: 'onboarding.state', transformer: v => parseInt(v as string) },
          last_submitted: { subject: 'onboarding.last_submitted', transformer: v => parseInt(v as string) }
        },
        query.filter
      )
      .sort(
        {
          last_submitted: 'onboarding.last_submitted',
          username: 'host.username',
          state: 'onboarding.state'
        },
        query.sort
      )
      .paginate({ page: query.page, per_page: query.per_page });
  }
}
