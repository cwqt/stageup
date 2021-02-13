// https://stackoverflow.com/a/59805161/8526764
const TRUE_ENV = process.env['NODE' + '_ENV'];
/* eslint @typescript-eslint/no-var-requires: "off" */
require('dotenv').config({ path: require('path').join(__dirname, `../../../apps/backend/.env.${TRUE_ENV}`) });

import { Environment } from '@core/interfaces';

interface IEnvironment {
  PRIVATE_KEY: string;
  EMAIL_ADDRESS: string;
  SITE_TITLE: string;
  API_URL: string;
  FE_URL: string;
  ENVIRONMENT: Environment;
  EXPRESS_PORT: number;
  LOCALTUNNEL_URL: string;
  SENDGRID: {
    USERNAME: string;
    API_KEY: string;
    ENABLED_IN_DEVELOPMENT: boolean;
  };
  MUX: {
    ACCESS_TOKEN: string;
    SECRET_KEY: string;
    HOOK_SIGNATURE: string;
    IMAGE_API_ENDPOINT: string;
  };
  PG: {
    USER: string;
    HOST: string;
    DB: string;
    PASS: string;
    PORT: number;
  };
  USE_MEMORYSTORE: boolean;
  REDIS: {
    HOST: string;
    PORT: number;
    TTL: number;
  };
  INFLUX: {
    HOST: string;
    DB: string;
  };
  AWS: {
    S3_ACCESS_KEY_ID: string;
    S3_ACCESS_SECRET_KEY: string;
    S3_BUCKET_NAME: string;
    S3_URL: string;
  };
  isEnv: (env: Environment | Environment[]) => boolean;
}

const Env: IEnvironment = {
  isEnv: (env: Environment | Environment[]) =>
    Array.isArray(env) ? env.some(e => e === TRUE_ENV) : env === TRUE_ENV,
  SITE_TITLE: 'StageUp',
  API_URL: process.env.API_URL,
  FE_URL: process.env.FE_URL,
  ENVIRONMENT: TRUE_ENV as Environment,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  EMAIL_ADDRESS: process.env.EMAIL_ADDRESS,
  EXPRESS_PORT: 3000,
  LOCALTUNNEL_URL: process.env.LOCALTUNNEL_URL,
  USE_MEMORYSTORE: process.env.USE_MEMORYSTORE === 'true',
  SENDGRID: {
    USERNAME: process.env.SENDGRID_USERNAME,
    API_KEY: process.env.SENDGRID_API_KEY,
    ENABLED_IN_DEVELOPMENT: process.env.SENDGRID_ENABLED_IN_DEVELOPMENT === "true"
  },
  MUX: {
    ACCESS_TOKEN: process.env.MUX_ACCESS_TOKEN,
    SECRET_KEY: process.env.MUX_SECRET_KEY,
    HOOK_SIGNATURE: process.env.MUX_HOOK_SIGNATURE,
    IMAGE_API_ENDPOINT: process.env.MUX_IMAGE_API_ENDPOINT
  },
  PG: {
    USER: process.env.POSTGRES_USER,
    PASS: process.env.POSTGRES_PASS,
    HOST: process.env.POSTGRES_HOST,
    DB: process.env.POSTGRES_DB,
    PORT: 5432
  },
  REDIS: {
    HOST: process.env.REDIS_HOST,
    PORT: 6379,
    TTL: 86400
  },
  AWS: {
    S3_ACCESS_KEY_ID: process.env.AWS_S3_KEY_ID,
    S3_ACCESS_SECRET_KEY: process.env.AWS_S3_ACCESS_SECRET_KEY,
    S3_BUCKET_NAME: process.env.AWS_S3_ACCESS_SECRET_KEY,
    S3_URL: process.env.AWS_S3_URL
  },
  INFLUX: {
    HOST: process.env.INFLUX_HOST,
    DB: process.env.INFLUX_DB
  }
};

export default Env;
