import { BackendProviderMap } from '@backend/common/providers';
import { BaseController, IControllerEndpoint, User, Validators } from '@core/api';
import { object, string } from 'superstruct';
import AuthStrat from '../common/authorisation';
import { verifyEmail } from '../common/email';
import Env from '../env';

export default class AuthController extends BaseController<BackendProviderMap> {
  verifyUserEmail(): IControllerEndpoint<string> {
    return {
      validators: {
        query: object({
          email_address: Validators.Fields.email,
          hash: string()
        })
      },
      middleware: this.middleware.rateLimit(3600, 10, this.providers.redis.connection),
      authorisation: AuthStrat.none,
      controller: async req => {
        const hash = req.query.hash as string;
        const email = req.query.email as string;

        // Verify against hash
        const isVerified = verifyEmail(email, hash);

        // Update verified state
        const u = await User.findOne({ email_address: email });
        u.is_verified = isVerified;
        await u.save();

        // Return redirect address
        return `${Env.FRONTEND.URL}/${req.locale.language}/verified?state=${isVerified ? 'true' : 'false'}`;
      }
    };
  }
}
