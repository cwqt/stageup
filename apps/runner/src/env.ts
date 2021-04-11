// https://stackoverflow.com/a/59805161/8526764
const TRUE_ENV = process.env['NODE' + '_ENV'];
/* eslint @typescript-eslint/no-var-requires: "off" */
require('dotenv-flow').config({ node_env: TRUE_ENV, silent: true });

import { Environment } from '@core/interfaces';
import {
  IAWS3ProviderConfig,
  IPostgresProviderConfig,
  IRedisProviderConfig,
  ISendGridProviderConfig
} from '@core/shared/api';
import { isEnv } from '@core/shared/helpers';

interface IEnvironment {
  ENVIRONMENT: Environment;
  EXPRESS_PORT: number;
  PRIVATE_KEY: string;
  EMAIL_ADDRESS: string;
  API_URL: string;
  REDIS: IRedisProviderConfig;
  SENDGRID: ISendGridProviderConfig;
  PG: IPostgresProviderConfig;
  AWS: IAWS3ProviderConfig;
  INTERNAL_KEY: string;
  isEnv: (env: Environment | Environment[]) => boolean;
}

const Env: IEnvironment = {
  isEnv: isEnv(TRUE_ENV as Environment),
  ENVIRONMENT: TRUE_ENV as Environment,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  EXPRESS_PORT: 3001,
  EMAIL_ADDRESS: process.env.EMAIL_ADDRESS,
  API_URL: process.env.API_URL,
  INTERNAL_KEY: process.env.INTERNAL_KEY,
  PG: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    port: 5432
  },
  AWS: {
    s3_access_key_id: process.env.AWS_S3_ACCESS_KEY_ID,
    s3_access_secret_key: process.env.AWS_S3_ACCESS_SECRET_KEY,
    s3_bucket_name: process.env.AWS_S3_BUCKET_NAME,
    s3_url: process.env.AWS_S3_URL,
    s3_region: process.env.AWS_S3_REGION
  },
  SENDGRID: {
    username: process.env.SENDGRID_USERNAME,
    api_key: process.env.SENDGRID_API_KEY,
    enabled: process.env.EMAIL_ENABLED === 'true'
  },
  REDIS: {
    host: process.env.BULLMQ_REDIS_HOST,
    port: 6379
  }
};

export default Env;
