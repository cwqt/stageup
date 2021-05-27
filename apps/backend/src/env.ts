// https://stackoverflow.com/a/59805161/8526764
const TRUE_ENV = process.env['NODE' + '_ENV'];
/* eslint @typescript-eslint/no-var-requires: "off" */
require('dotenv-flow').config({ node_env: TRUE_ENV, silent: true });

import { isEnv } from '@core/helpers';
import { Environment } from '@core/interfaces';
import {
  IMuxProviderConfig,
  IEmailProviderConfig,
  IPostgresProviderConfig,
  IRedisProviderConfig,
  IAWS3ProviderConfig,
  IStoreProviderConfig,
  ILocalTunnelProviderConfig,
  IStripeProviderConfig
} from '@core/api';

type Envify<T> = { [index in keyof T as Uppercase<string & index>]: T[index] };

interface IEnvironment {
  BACKEND: { PORT: number; ENDPOINT: string; URL: string };
  FRONTEND: { PORT: number; ENDPOINT: string; URL: string };
  ENVIRONMENT: Environment;
  PRIVATE_KEY: string;
  EMAIL_ADDRESS: string;
  SITE_TITLE: string;
  UWU_MODE: boolean;
  WEBHOOK_URL: string;
  PG: Envify<IPostgresProviderConfig>;
  MUX: Envify<IMuxProviderConfig>;
  AWS: Envify<IAWS3ProviderConfig>;
  REDIS: Envify<IRedisProviderConfig>;
  STORE: Envify<IStoreProviderConfig>;
  STRIPE: Envify<IStripeProviderConfig>;
  EMAIL: Envify<IEmailProviderConfig>;
  LOCALTUNNEL: Envify<ILocalTunnelProviderConfig>;
  isEnv: (env: Environment | Environment[]) => boolean;
}

const Env: IEnvironment = {
  isEnv: isEnv(TRUE_ENV as Environment),
  SITE_TITLE: 'StageUp',
  BACKEND: {
    PORT: parseInt(process.env.BACKEND_PORT),
    ENDPOINT: process.env.BACKEND_ENDPOINT,
    URL: `${process.env.LOAD_BALANCER_URL}:${process.env.BACKEND_PORT}${process.env.BACKEND_ENDPOINT}`
  },
  FRONTEND: {
    PORT: parseInt(process.env.FRONTEND_PORT),
    ENDPOINT: process.env.FRONTEND_ENDPOINT,
    URL: `${process.env.LOAD_BALANCER_URL}:${process.env.FRONTEND_PORT}${process.env.FRONTEND_ENDPOINT}`
  },
  ENVIRONMENT: TRUE_ENV as Environment,
  PRIVATE_KEY: process.env.BACKEND_PRIVATE_KEY,
  EMAIL_ADDRESS: process.env.EMAIL_ADDRESS,
  WEBHOOK_URL: process.env.WEBHOOK_URL,
  LOCALTUNNEL: {
    PORT: parseInt(process.env.BACKEND_PORT),
    DOMAIN: new URL(process.env.WEBHOOK_URL).hostname.split('.').shift()
  },
  UWU_MODE: process.env.UWU_MODE === 'true',
  MUX: {
    ACCESS_TOKEN: process.env.MUX_ACCESS_TOKEN,
    SECRET_KEY: process.env.MUX_SECRET_KEY,
    HOOK_SIGNATURE: process.env.MUX_HOOK_SIGNATURE
  },
  PG: {
    USERNAME: process.env.POSTGRES_USER,
    PASSWORD: process.env.POSTGRES_PASSWORD,
    HOST: process.env.POSTGRES_HOST,
    DATABASE: process.env.POSTGRES_DB,
    PORT: 5432
  },
  REDIS: {
    HOST: process.env.BACKEND_REDIS_HOST,
    PORT: 6379
  },
  STORE: {
    HOST: process.env.BACKEND_STORE_HOST,
    PORT: 6379,
    TTL: 86400
  },
  EMAIL: {
    API_KEY: process.env.QUEUE_SENDGRID_API_KEY,
    ENABLED: process.env.QUEUE_EMAIL_ENABLED === 'true'
  },
  STRIPE: {
    PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY,
    PRIVATE_KEY: process.env.STRIPE_PRIVATE_KEY,
    HOOK_SIGNATURE: process.env.STRIPE_HOOK_SIGNATURE,
    CLIENT_ID: process.env.STRIPE_CLIENT_ID
  },
  AWS: {
    S3_ACCESS_KEY_ID: process.env.AWS_S3_ACCESS_KEY_ID,
    S3_ACCESS_SECRET_KEY: process.env.AWS_S3_ACCESS_SECRET_KEY,
    S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
    S3_URL: process.env.AWS_S3_URL,
    S3_REGION: process.env.AWS_S3_REGION
  }
};

console.log(Env.LOCALTUNNEL);

export default Env;
