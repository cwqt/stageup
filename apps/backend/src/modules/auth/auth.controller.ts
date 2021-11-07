import { AppCache, IControllerEndpoint, Middleware, CACHE_PROVIDER, User, Validators } from '@core/api';
import { object, string } from 'superstruct';
import { Inject, Service } from 'typedi';
import { ModuleController } from '@core/api';

import AuthStrat from '../../common/authorisation';
import Env from '../../env';
import { AuthService } from './auth.service';

@Service()
export class AuthController extends ModuleController {
  constructor(private authService: AuthService, @Inject(CACHE_PROVIDER) private cache: AppCache) {
    super();
  }

  verifyUserEmail: IControllerEndpoint<string> = {
    validators: {
      query: object({
        email_address: Validators.Fields.email,
        hash: string()
      })
    },
    middleware: Middleware.rateLimit(3600, Env.RATE_LIMIT, this.cache.client),
    authorisation: AuthStrat.none,
    controller: async req => {
      const isVerified = this.authService.verifyUserEmailAddress(req.query.email as string, req.query.hash as string);

      // Return redirect address
      return `${Env.FRONTEND.URL}/${req.locale.language}/verified?state=${isVerified}`;
    }
  };
}
