import Env from '@backend/env';
import { PG_MODELS, Providers } from '@core/api';
import { Environment } from '@core/interfaces';
import { Token } from 'typedi';
import { log } from './logger';
import { Configuration } from './configuration.entity';

// Dependency Injection across the applications' modules
export const PROVIDERS = new Token<BackendProviderMap>('PROVIDERS');

const PROVIDER_MAP = {
  mux: new Providers.Mux({
    access_token: Env.MUX.ACCESS_TOKEN,
    secret_key: Env.MUX.SECRET_KEY,
    webhook_signature: Env.MUX.WEBHOOK_SIGNATURE,
    data_env_key: Env.MUX.DATA_ENV_KEY
  }),
  torm: new Providers.Postgres(
    {
      host: Env.PG.HOST,
      port: Env.PG.PORT,
      username: Env.PG.USERNAME,
      password: Env.PG.PASSWORD,
      database: Env.PG.DATABASE,
      // IMPORTANT Re-sync in test, dev & staging - prod use migrations
      // need to write migrations first!!
      synchronize: true //!Env.isEnv(Environment.Production)
    },
    { ...PG_MODELS, Configuration }
  ),
  redis: new Providers.Redis({
    host: Env.REDIS.HOST,
    port: Env.REDIS.PORT
  }),
  store: new Providers.Store({
    host: Env.STORE.HOST,
    port: Env.STORE.PORT,
    ttl: Env.STORE.TTL
  }),
  stripe: new Providers.Stripe({
    public_key: Env.STRIPE.PUBLIC_KEY,
    private_key: Env.STRIPE.PRIVATE_KEY,
    webhook_signature: Env.STRIPE.WEBHOOK_SIGNATURE,
    client_id: Env.STRIPE.CLIENT_ID
  }),
  email: new Providers.Email(
    {
      api_key: Env.EMAIL.API_KEY,
      enabled: Env.EMAIL.ENABLED
    },
    log
  ),
  blob: new Providers.Blob({
    s3_access_key_id: Env.AWS.S3_ACCESS_KEY_ID,
    s3_access_secret_key: Env.AWS.S3_ACCESS_SECRET_KEY,
    s3_bucket_name: Env.AWS.S3_BUCKET_NAME,
    s3_url: Env.AWS.S3_URL,
    s3_region: Env.AWS.S3_REGION
  }),
  bus: new Providers.EventBus({}, log),
  // Use HTTP tunnelling in development/testing for receiving webhooks without the need
  // to port forward routers
  tunnel:
    Env.IS_LOCAL &&
    new Providers.LocalTunnel({
      port: Env.LOCALTUNNEL.PORT,
      domain: Env.LOCALTUNNEL.DOMAIN
    })
} as const;

// Some providers may not exist at this point (e.g. LocalTunnel only in dev)
// so filter out the undefined providers
export default Object.keys(PROVIDER_MAP).reduce(
  (acc, curr) => (PROVIDER_MAP[curr] ? ((acc[curr] = PROVIDER_MAP[curr]), acc) : acc),
  {}
);

export type BackendProviderMap = Partial<typeof PROVIDER_MAP>;
