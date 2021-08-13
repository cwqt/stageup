import { BackendProviderMap } from '@backend/common/providers';
import { BaseController, Consentable, IControllerEndpoint } from '@core/api';
import { ConsentableType, ConsentableTypes, IConsentable } from '@core/interfaces';
import { enums, object } from 'superstruct';
import AuthStrat from '../common/authorisation';

export default class GdprController extends BaseController<BackendProviderMap> {
  getLatestDocument(): IControllerEndpoint<IConsentable<ConsentableType>> {
    return {
      authorisation: AuthStrat.none,
      validators: {
        query: object({ type: enums<ConsentableType>(ConsentableTypes) })
      },
      controller: async req => {
        return await this.ORM.createQueryBuilder(Consentable, 'consentable')
          .where('consentable.type = :type', { type: req.query.type })
          .orderBy('consentable.version', 'DESC')
          .getOne(); // Get the latest (i.e. highest version) of the document
      }
    };
  }
}
