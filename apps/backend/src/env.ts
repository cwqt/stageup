// https://stackoverflow.com/a/59805161/8526764
const TRUE_ENV = process.env['NODE' + '_ENV'];
/* eslint @typescript-eslint/no-var-requires: "off" */
require('dotenv-flow').config({ node_env: TRUE_ENV, silent: true });
process.env.GOOGLE_APPLICATION_CREDENTIALS = ''; // Prevent dotenv from loading core.service_account.json

import { isEnv } from '@core/helpers';
import { Environment } from '@core/interfaces';
import {
  IMuxProviderConfig,
  ISendGridMailProviderConfig,
  IPostgresProviderConfig,
  IRedisProviderConfig,
  IStoreProviderConfig,
  ILocalTunnelProviderConfig,
  IStripeProviderConfig,
  IGCPBlobProviderConfig,
  REDIS_PROVIDER
} from '@core/api';
import { ISocialAuth } from '@core/interfaces';

type Envify<T> = { [index in keyof T as Uppercase<string & index>]: T[index] } & { [index: string]: any };

const isLocal = ['localhost', '127.0.0.1'].some(v => process.env.LOAD_BALANCER_URL.includes(v));

const Env: {
  IS_LOCAL: boolean; // running on a local machine, not deployed
  BACKEND: { PORT: number; ENDPOINT: string; URL: string };
  FRONTEND: { PORT: number; ENDPOINT: string; URL: string };
  ENVIRONMENT: Environment;
  PRIVATE_KEY: string;
  EMAIL_ADDRESS: string;
  SITE_TITLE: string;
  UWU_MODE: boolean;
  PG: Envify<IPostgresProviderConfig>;
  MUX: Envify<IMuxProviderConfig>;
  GOOGLE_STORAGE: Envify<IGCPBlobProviderConfig>;
  REDIS: Envify<IRedisProviderConfig>;
  STORE: Envify<IStoreProviderConfig>;
  STRIPE: Envify<IStripeProviderConfig>;
  EMAIL: Envify<ISendGridMailProviderConfig>;
  LOCALTUNNEL: Envify<ILocalTunnelProviderConfig>;
  SOCIAL_AUTH: Envify<ISocialAuth>;
  isEnv: (env: Environment | Environment[]) => boolean;
  RATE_LIMIT: number;
} = {
  isEnv: isEnv(TRUE_ENV as Environment),
  IS_LOCAL: isLocal,
  SITE_TITLE: 'StageUp',
  BACKEND: {
    PORT: parseInt(process.env.BACKEND_PORT),
    ENDPOINT: process.env.BACKEND_ENDPOINT,
    // Only include the port when running locally
    URL: isLocal
      ? `${process.env.LOAD_BALANCER_URL}:${process.env.BACKEND_PORT}${process.env.BACKEND_ENDPOINT}`
      : `${process.env.LOAD_BALANCER_URL}${process.env.BACKEND_ENDPOINT}`
  },
  FRONTEND: {
    PORT: parseInt(process.env.FRONTEND_PORT),
    ENDPOINT: process.env.FRONTEND_ENDPOINT,
    // Only include the port when running locally
    URL: isLocal
      ? `${process.env.LOAD_BALANCER_URL}:${process.env.FRONTEND_PORT}${process.env.FRONTEND_ENDPOINT}`
      : `${process.env.LOAD_BALANCER_URL}${process.env.FRONTEND_ENDPOINT}`
  },
  ENVIRONMENT: TRUE_ENV as Environment,
  PRIVATE_KEY: process.env.BACKEND_PRIVATE_KEY,
  EMAIL_ADDRESS: process.env.EMAIL_ADDRESS,
  // Only use HTTP Tunneling in local development so we don't need to port forward routers to recieve webhooks
  LOCALTUNNEL: isLocal && {
    PORT: parseInt(process.env.BACKEND_PORT),
    DOMAIN: new URL(process.env.HTTP_TUNNEL_URL).hostname.split('.').shift()
  },
  UWU_MODE: process.env.UWU_MODE === 'true',
  MUX: {
    ACCESS_TOKEN: process.env.MUX_ACCESS_TOKEN,
    SECRET_KEY: process.env.MUX_SECRET_KEY,
    WEBHOOK_SIGNATURE: process.env.MUX_WEBHOOK_SIGNATURE,
    DATA_ENV_KEY: process.env.MUX_DATA_ENV_KEY,
    LIVE_STREAM_TEST_MODE: process.env.MUX_LIVE_STREAM_TEST_MODE === 'true'
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
    TTL: 86400,
    REDIS_TOKEN: REDIS_PROVIDER
  },
  EMAIL: {
    API_KEY: process.env.SENDGRID_API_KEY,
    ENABLED: process.env.QUEUE_EMAIL_ENABLED === 'true'
  },
  STRIPE: {
    PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY,
    PRIVATE_KEY: process.env.STRIPE_PRIVATE_KEY,
    WEBHOOK_SIGNATURE: process.env.STRIPE_WEBHOOK_SIGNATURE,
    CLIENT_ID: process.env.STRIPE_CLIENT_ID
  },
  GOOGLE_STORAGE: {
    SERVICE_ACCOUNT_KEY: process.env.GOOGLE_STORAGE_SERVICE_ACCOUNT_KEY,
    SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_STORAGE_SERVICE_ACCOUNT_EMAIL,
    BUCKET_NAME: process.env.GOOGLE_STORAGE_BUCKET_NAME,
    PUBLIC_URL: process.env.GOOGLE_STORAGE_PUBLIC_URL
  },
  SOCIAL_AUTH: {
    GOOGLE: process.env.GOOGLE_AUTH_APP_ID,
    FACEBOOK: process.env.FACEBOOK_AUTH_APP_ID
  },
  RATE_LIMIT: parseInt(process.env.RATE_LIMIT)
};

export default Env;
