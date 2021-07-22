import { BaseController, IControllerEndpoint } from '@core/api';
import { BackendProviderMap } from '@backend/common/providers';
import AuthStrat from '../common/authorisation';

export default class ConsentController extends BaseController<BackendProviderMap> {

  getGeneralTerms(): IControllerEndpoint<any> {
    return {
      authorisation: AuthStrat.none,
      controller: async req => {
        // TODO: GET GENERAL TERMS AND CONDITIONS LOCATION (AND IDENTIFIER?)
        // THEN CLIENT CAN BE RESPONSIBLE FOR DOWNLOADING IT?
      }
    };
  }
}
