import { Host, IControllerEndpoint, Performance, PostgresProvider, POSTGRES_PROVIDER } from '@core/api';
import { ISearchResponse, PerformanceStatus } from '@core/interfaces';
import { Inject, Service } from 'typedi';
import { ModuleController } from '@core/api';

import AuthStrat from '../../common/authorisation';
import { Connection } from 'typeorm';

@Service()
export class SearchController extends ModuleController {
  constructor(@Inject(POSTGRES_PROVIDER) private ORM: Connection) {
    super();
  }

  search: IControllerEndpoint<ISearchResponse> = {
    authorisation: AuthStrat.none,
    // validators: {
    //   query: object({ return_only: optional(enums(['hosts', 'performance'])) })
    // },ORM
    controller: async req => {
      // return both if no query param passed
      const fetchBoth = req.query.return_only == null;
      // to lowercase for case insensitivty
      if (req.query.query) req.query.query = (req.query.query as string).toLowerCase();

      const searchHosts = () =>
        this.ORM.createQueryBuilder(Host, 'h')
          .where('LOWER(h.name) LIKE :name', {
            name: req.query.query ? `%${req.query.query as string}%` : '%'
          })
          .paginate({ serialiser: p => p.toStub() });

      const hiddenStates = [PerformanceStatus.Deleted, PerformanceStatus.Draft];
      const searchPerformances = () =>
        this.ORM.createQueryBuilder(Performance, 'p')
          .innerJoinAndSelect('p.host', 'host')
          .leftJoinAndMapMany('host.performances', Host, 'hosts', 'host.name = p.name')
          .where('LOWER(p.name) LIKE :name', {
            name: req.query.query ? `%${req.query.query as string}%` : '%'
          })
          .andWhere('p.status NOT IN (:...states)', { states: hiddenStates })
          .paginate({ serialiser: h => h.toStub() });

      return {
        hosts: req.query.return_only == 'hosts' || fetchBoth ? await searchHosts() : { data: [] },
        performances: req.query.return_only == 'performances' || fetchBoth ? await searchPerformances() : { data: [] }
      };
    }
  };
}
