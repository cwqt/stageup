import { Environment } from '@core/interfaces';
import dbless from 'dbless-email-verification';
import Env from '../env';

export const verifyEmail = (email: string, hash: string): boolean => {
  if (!Env.isEnv(Environment.Production)) return true;
  return dbless.verifyHash(hash, email, Env.PRIVATE_KEY);
};
