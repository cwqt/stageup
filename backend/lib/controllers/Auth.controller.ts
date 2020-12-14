import { Request } from 'express';
const { query } = require('express-validator');
import { validate } from '../common/validate';

import config from '../config';
import { ErrorHandler } from '../common/errors';
import { User } from '../models/User.model';
import { HTTP } from '@eventi/interfaces';
import { verifyEmail } from '../common/email';

export const validators = {
  verify: validate([
    query('email').isEmail().normalizeEmail().withMessage('not a valid email address'),
    query('hash').not().isEmpty().trim().withMessage('must have a verification hash'),
  ]),
};

export const verifyUserEmail = async (req: Request): Promise<string> => {
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
};
