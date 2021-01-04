import { Request } from 'express';

import config from '../config';
import { ErrorHandler } from '../common/errors';
import { User } from '../models/Users/User.model';
import { ErrCode, HTTP } from '@eventi/interfaces';
import { verifyEmail } from '../common/email';
import { BaseArgs, BaseController, IControllerEndpoint } from '../common/controller';
import AuthStrat from '../authorisation';
import { query } from '../common/validate';
import Validators from '../common/validators';

export default class AuthController extends BaseController {
  constructor(...args: BaseArgs) {
    super(...args);
  }

  verifyUserEmail(): IControllerEndpoint<string> {
    return {
      validators: [
        query<{email:string, hash:string}>({
          email: v => Validators.Fields.email(v),
          hash: v => Validators.Fields.isString(v, ErrCode.MISSING_FIELD),
        })
      ],
      preMiddlewares: [this.mws.limiter(3600, 10)],
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<string> => {
        const hash = req.query.hash as string;
        const email = req.query.email as string;

        // Verify against hash
        const isVerified = verifyEmail(email, hash);
        if (!isVerified) throw new ErrorHandler(HTTP.BadRequest, ErrCode.INCORRECT);

        // Update verified state
        const u = await User.findOne({ email_address: email });
        u.is_verified = isVerified;
        await u.save();

        // Return redirect address
        return `${config.FE_URL}/verified?state=${isVerified}`;
      },
    };
  }
}
