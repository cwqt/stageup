import Env from '@backend/env';
import { User } from '@core/api';
import { Environment } from '@core/interfaces';
import { Service } from 'typedi';
import dbless from 'dbless-email-verification';
import { ModuleService } from '@core/api';

@Service()
export class AuthService extends ModuleService {
  constructor() {
    super();
  }

  async generateEmailVerificationHash(email: string): Promise<string> {
    return dbless.generateVerificationHash(email, Env.PRIVATE_KEY, 60);
  }

  async verifyUserEmailAddress(email: string, hash: string): Promise<boolean> {
    // Verify against hash
    if (!Env.isEnv(Environment.Production)) return true;
    const isValid = dbless.verifyHash(hash, email, Env.PRIVATE_KEY);

    if (isValid) {
      // Update verified state
      const u = await User.findOne({ email_address: email });
      u.is_verified = true;
      await u.save();
      return true;
    } else {
      return false;
    }
  }
}
