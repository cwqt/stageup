import { Request } from 'express';
const { query } = require('express-validator');
import { validate } from '../common/validate';

import config from '../config';
import { ErrorHandler } from '../common/errors';
import { User } from '../models/Users/User.model';
import { HTTP } from '@eventi/interfaces';
import { verifyEmail } from '../common/email';
import { BaseArgs, BaseController, IControllerEndpoint } from '../common/controller';
import AuthStrat from '../authorisation';

export default class AuthController extends BaseController {
  constructor(...args: BaseArgs) {
    super(...args);
  }

  verifyUserEmail(): IControllerEndpoint<string> {
    return {
      validator: validate([
        query('email').isEmail().normalizeEmail().withMessage('not a valid email address'),
        query('hash').not().isEmpty().trim().withMessage('must have a verification hash'),
      ]),
      preMiddlewares: [this.mws.limiter(3600, 10)],
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<string> => {
        const hash = req.query.hash as string;
        const email = req.query.email as string;

        // Verify against hash
        const isVerified = verifyEmail(email, hash);
        if (!isVerified) throw new ErrorHandler(HTTP.BadRequest, 'Invalid email or hash');

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
