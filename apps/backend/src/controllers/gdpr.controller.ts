import { ConsentableType, ConsentableTypes } from '@core/interfaces';
import { BaseController, IControllerEndpoint, Consent } from '@core/api';
import { BackendProviderMap } from '@backend/common/providers';
import AuthStrat from '../common/authorisation';
import { enums, object } from 'superstruct';

export default class GdprController extends BaseController<BackendProviderMap> {
  getLatestDocument(): IControllerEndpoint<Consent<ConsentableType>> {
    return {
      authorisation: AuthStrat.none,
      validators: {
        query: object({ type: enums<ConsentableType>(ConsentableTypes) })
      },
      controller: async req => {
        // TODO: WHEN DEV IS UP TO DATE WITH TABLES, CONSENT NEEDS RENAMING TO 'CONSENTABLE'
        return await this.ORM.createQueryBuilder(Consent, 'consentable')
          .where('consentable.type = :type', { type: req.query.type })
          .orderBy('consentable.version', 'DESC')
          .getOne(); // Get the latest (i.e. highest version) of the document
      }
    };
  }
}
