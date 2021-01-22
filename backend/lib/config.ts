import { Except } from 'type-fest';

require('dotenv').config();

export enum Environment {
  Production = 'production',
  Development = 'development',
  Testing = 'testing'
}

if (!Object.values(Environment).includes(process.env.NODE_ENV as any))
  throw new Error('Not a valid Environment');
  
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
  };
  isEnv: (env:Environment) => boolean
}

const base: Except<IEnvironment, 'API_URL' | 'FE_URL' | 'SITE_TITLE'> = {
  isEnv: (env:Environment) => env !== base.ENVIRONMENT,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  EMAIL_ADDRESS: process.env.EMAIL_ADDRESS,
  EXPRESS_PORT: 3000,
  ENVIRONMENT: process.env.NODE_ENV as Environment,
  LOCALTUNNEL_URL: process.env.LOCALTUNNEL_URL,
  SENDGRID: {
    USERNAME: process.env.SENDGRID_USERNAME,
    API_KEY: process.env.SENDGRID_API_KEY
  },
  MUX: {
    ACCESS_TOKEN: process.env.MUX_ACCESS_TOKEN,
    SECRET_KEY: process.env.MUX_SECRET_KEY,
    HOOK_SIGNATURE: process.env.MUX_HOOK_SIGNATURE,
    IMAGE_API_ENDPOINT: 'https://image.mux.com'
  },
  PG: {
    USER: process.env.PG_USER,
    PASS: process.env.PG_PASS,
    HOST: process.env.PRODUCTION === 'true' ? process.env.POSTGRES_SERVICE_HOST : 'localhost',
    DB: 'postgres',
    PORT: 5432
  },
  USE_MEMORYSTORE: process.env.USE_MEMORYSTORE === 'true',
  REDIS: {
    HOST: process.env.PRODUCTION === 'true' ? process.env.REDIS_SERVICE_HOST : 'localhost',
    PORT: 6379,
    TTL: 86400
  },
  AWS: {
    S3_ACCESS_KEY_ID: process.env.AWS_S3_KEY_ID,
    S3_ACCESS_SECRET_KEY: process.env.AWS_S3_ACCESS_SECRET_KEY,
    S3_BUCKET_NAME: process.env.AWS_S3_ACCESS_SECRET_KEY
  },
  INFLUX: {
    HOST: process.env.PRODUCTION === 'true' ? process.env.INFLUX_HOST : 'localhost',
    DB: 'metrics'
  }
};

const environment: IEnvironment = (() => {
  switch (process.env.NODE_ENV) {
    case Environment.Production:
      return {
        ...base,
        SITE_TITLE: 'my.eventi.net',
        API_URL: 'https://api.eventi.com',
        FE_URL: 'https://eventi.com',
        PRODUCTION: true
      };
    case Environment.Development:
      return {
        ...base,
        SITE_TITLE: 'dev.eventi.net',
        API_URL: 'http://localhost:3000',
        FE_URL: 'http://localhost:4200',
        DEVELOPMENT: true
      };
    case Environment.Testing:
      return {
        ...base,
        SITE_TITLE: 'dev.eventi.net',
        API_URL: 'http://localhost:3000',
        FE_URL: 'http://localhost:4200',
        TESTING: true
      };
    default:
      throw new Error('Missing .env NODE_ENV');
  }
})();

console.log('\nBackend running in env: \u001B[04m' + process.env.NODE_ENV + '\u001B[0m\n');

export default environment;
