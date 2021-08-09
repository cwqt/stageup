import { Consentable, IControllerEndpoint } from '@core/api';
import { ConsentableType, ConsentableTypes, IConsentable } from '@core/interfaces';
import { enums, object } from 'superstruct';
import { Inject, Service } from 'typedi';
import { ModuleController } from '@core/api';

import AuthStrat from '../../common/authorisation';
import { GdprService } from './gdpr.service';

@Service()
export class GdprController extends ModuleController {
  constructor(private gdprService: GdprService) {
    super();
  }

  getLatestDocument: IControllerEndpoint<IConsentable<ConsentableType>> = {
    authorisation: AuthStrat.none,
    validators: {
      query: object({ type: enums<ConsentableType>(ConsentableTypes) })
    },
    controller: async req => this.gdprService.readConsentable(req.query.type as ConsentableType, 'latest')
  };
}
