// https://stackoverflow.com/a/59805161/8526764
const TRUE_ENV = process.env['NODE' + '_ENV'];
require('dotenv-flow').config({ node_env: TRUE_ENV });

import { isEnv } from '@core/shared/helpers';
import { Environment } from '@core/interfaces';
import {
  IMuxProviderConfig,
  IInfluxProviderConfig,
  IPostgresProviderConfig,
  IRedisProviderConfig,
  IAWS3ProviderConfig,
  IStoreProviderConfig,
  ILocalTunnelProviderConfig,
} from '@core/shared/api';

type Envify<T> = { [index: string]: any };
// type Envify<T> = { [index in keyof T as `${Uppercase<string & index>}`]: T[index] };

interface IEnvironment {
  ENVIRONMENT: Environment;
  PRIVATE_KEY: string;
  EMAIL_ADDRESS: string;
  SITE_TITLE: string;
  API_ENDPOINT: string;
  API_URL: string;
  FE_URL: string;
  QUEUE_URL: string;
  EXPRESS_PORT: number;
  UWU_MODE: boolean;
  INTERNAL_KEY: string;
  PG: Envify<IPostgresProviderConfig>;
  MUX: Envify<IMuxProviderConfig>;
  AWS: Envify<IAWS3ProviderConfig>;
  REDIS: Envify<IRedisProviderConfig>;
  STORE: Envify<IStoreProviderConfig>;
  INFLUX: Envify<IInfluxProviderConfig>;
  LOCALTUNNEL: Envify<ILocalTunnelProviderConfig>;
  isEnv: (env: Environment | Environment[]) => boolean;
}

const Env: IEnvironment = {
  isEnv: isEnv(TRUE_ENV as Environment),
  SITE_TITLE: 'StageUp',
  API_ENDPOINT: process.env.API_ENDPOINT || '',
  API_URL: process.env.API_URL,
  FE_URL: process.env.FE_URL,
  ENVIRONMENT: TRUE_ENV as Environment,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  EMAIL_ADDRESS: process.env.EMAIL_ADDRESS,
  QUEUE_URL: process.env.QUEUE_URL,
  INTERNAL_KEY: process.env.INTERNAL_KEY,
  EXPRESS_PORT: 3000,
  LOCALTUNNEL: {
    PORT: 3000,
    DOMAIN: process.env.LOCALTUNNEL_URL
  },
  UWU_MODE: process.env.UWU_MODE === 'true',
  MUX: {
    ACCESS_TOKEN: process.env.MUX_ACCESS_TOKEN,
    SECRET_KEY: process.env.MUX_SECRET_KEY,
    HOOK_SIGNATURE: process.env.MUX_HOOK_SIGNATURE,
    IMAGE_API_ENDPOINT: process.env.MUX_IMAGE_API_ENDPOINT
  },
  PG: {
    USERNAME: process.env.POSTGRES_USER,
    PASSWORD: process.env.POSTGRES_PASSWORD,
    HOST: process.env.POSTGRES_HOST,
    DATABASE: process.env.POSTGRES_DB,
    PORT: 5432
  },
  REDIS: {
    HOST: process.env.REDIS_HOST,
    PORT: 6379
  },
  STORE: {
    USE_MEMORYSTORE: process.env.USE_MEMORYSTORE === 'true',
    HOST: process.env.STORE_HOST,
    PORT: 6379,
    TTL: 86400
  },
  AWS: {
    S3_ACCESS_KEY_ID: process.env.AWS_S3_KEY_ID,
    S3_ACCESS_SECRET_KEY: process.env.AWS_S3_ACCESS_SECRET_KEY,
    S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
    S3_URL: process.env.AWS_S3_URL
  },
  INFLUX: {
    HOST: process.env.INFLUX_HOST,
    DATABASE: process.env.INFLUX_DATABASE
  }
};

export default Env;
