// https://stackoverflow.com/a/59805161/8526764
const TRUE_ENV = process.env['NODE' + '_ENV'];
require('dotenv-flow').config({ node_env: TRUE_ENV });

import { Environment } from '@core/interfaces';
import {
  IRedisProviderConfig,
  ISendGridProviderConfig,
} from '@core/shared/api';
import { isEnv } from '@core/shared/helpers';

interface IEnvironment {
  ENVIRONMENT: Environment;
  EXPRESS_PORT: number;
  PRIVATE_KEY: string;
  API_URL:string;
  REDIS: IRedisProviderConfig;
  SENDGRID: ISendGridProviderConfig;
  INTERNAL_KEY: string;
  isEnv: (env: Environment | Environment[]) => boolean;
}

const Env: IEnvironment = {
  isEnv: isEnv(TRUE_ENV as Environment),
  ENVIRONMENT: TRUE_ENV as Environment,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  EXPRESS_PORT: 3001,
  API_URL: process.env.API_URL,
  INTERNAL_KEY: process.env.INTERNAL_KEY,
  SENDGRID: {
    username: process.env.SENDGRID_USERNAME,
    api_key: process.env.SENDGRID_API_KEY,
    enabled: process.env.EMAIL_ENABLED === "true"
  },
  REDIS: {
    host: process.env.REDIS_HOST,
    port: 6379
  },
};

export default Env;
