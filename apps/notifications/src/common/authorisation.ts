import { Environment, ErrCode } from '@core/interfaces';
import Env from '../env';
import { AuthStrategy, AuthStratReturn } from '@core/api';

const isEnv = (env: Environment): AuthStrategy => {
  return async (req, providers): Promise<AuthStratReturn> => {
    if (!Env.isEnv(env)) return [false, {}, ErrCode.UNKNOWN];
    return [true, {}];
  };
};

import { Auth } from '@core/api';
export default {
  isEnv,
  ...Auth
};
