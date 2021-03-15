import { ISearchResponse } from '@core/interfaces';

import { BaseController, IControllerEndpoint, Performance, Host, query } from '@core/shared/api';
import AuthStrat from '../common/authorisation';
import { BackendDataClient } from '../common/data';

export default class SearchController extends BaseController<BackendDataClient> {
  search(): IControllerEndpoint<ISearchResponse> {
    return {
      validators: [
        query({
          return_only: v => v.optional({ nullable: true }).isIn(['hosts', 'performances'])
        })
      ],
      authStrategy: AuthStrat.none,
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
            .paginate(p => p.toStub());

        const searchPerformances = () =>
          this.ORM.createQueryBuilder(Performance, 'p')
            .innerJoinAndSelect('p.host', 'host')
            .leftJoinAndMapMany('host.performances', Host, 'hosts', 'host.name = p.name')
            .where('LOWER(p.name) LIKE :name', {
              name: req.query.query ? `%${req.query.query as string}%` : '%'
            })
            .paginate(h => h.toStub());

        return {
          hosts: req.query.return_only == 'hosts' || fetchBoth ? await searchHosts() : { data: [] },
          performances: req.query.return_only == 'performances' || fetchBoth ? await searchPerformances() : { data: [] }
        };
      }
    };
  }
}
