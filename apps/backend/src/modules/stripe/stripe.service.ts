import { Logger, LOGGING_PROVIDER } from '@core/api';
import { Inject, Service } from 'typedi';
import { ModuleService } from '@core/api';

@Service()
export class StripeService extends ModuleService {
  constructor(@Inject(LOGGING_PROVIDER) private log: Logger) {
    super();
  }
}
