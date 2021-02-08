import { ErrCode } from '@core/interfaces';
import Env from '../env';
import { User } from '../models/users/user.model';
import { verifyEmail } from '../common/email';

import AuthStrat from '../common/authorisation';
import Validators, { query } from '../common/validate';
import { BaseController, IControllerEndpoint } from '../common/controller';

export default class AuthController extends BaseController {
  verifyUserEmail(): IControllerEndpoint<string> {
    return {
      validators: [
        query<{ email: string; hash: string }>({
          email: v => Validators.Fields.email(v),
          hash: v => Validators.Fields.isString(v, ErrCode.MISSING_FIELD)
        })
      ],
      preMiddlewares: [this.mws.limiter(3600, 10)],
      authStrategy: AuthStrat.none,
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
        return `${Env.FE_URL}/verified?state=${isVerified ? 'true' : 'false'}`;
      }
    };
  }
}
