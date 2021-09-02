import { IControllerEndpoint } from '@core/api';
import { router as BullRouter } from 'bull-board';
import { Service } from 'typedi';
import { ModuleController } from '@core/api';

import Auth from '../../common/authorisation';

@Service()
export class JobQueueController extends ModuleController {
  constructor() {
    super();
  }

  jobQueueUi: IControllerEndpoint<void> = {
    authorisation: Auth.isSiteAdmin,
    controller: async req => {},
    handler: BullRouter as any
  };
}
