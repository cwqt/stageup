import { Request } from 'express';

import config from '../config';
import { ErrorHandler } from '../common/errors';
import { User } from '../models/Users/User.model';
import { ErrCode, HTTP } from '@eventi/interfaces';
import { verifyEmail } from '../common/email';
import { BaseController, IControllerEndpoint } from '../common/controller';
import AuthStrat from '../common/authorisation';
import Validators, { query } from '../common/validate';

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
      controller: async (request: Request): Promise<string> => {
        const hash = request.query.hash as string;
        const email = request.query.email as string;

        // Verify against hash
        const isVerified = verifyEmail(email, hash);
        if (!isVerified) {
          throw new ErrorHandler(HTTP.BadRequest, ErrCode.INCORRECT);
        }

        // Update verified state
        const u = await User.findOne({ email_address: email });
        u.is_verified = isVerified;
        await u.save();

        // Return redirect address
        return `${config.FE_URL}/verified?state=${isVerified}`;
      }
    };
  }
}
