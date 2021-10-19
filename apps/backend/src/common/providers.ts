import Env from '@backend/env';
import { JobQueueProvider, JOB_QUEUE_PROVIDER } from '@backend/modules/queue/queue.provider';
import {
  BLOB_PROVIDER,
  EMAIL_PROVIDER,
  EVENT_BUS_PROVIDER,
  GCPBlobProvider,
  HTTP_TUNNEL_PROVIDER,
  MuxProvider,
  MUX_PROVIDER,
  PG_MODELS,
  PostgresProvider,
  POSTGRES_PROVIDER,
  Provider,
  RedisProvider,
  REDIS_PROVIDER,
  RxmqEventBus,
  SSEHubManagerProvider,
  SSE_HUB_PROVIDER,
  StoreProvider,
  STORE_PROVIDER,
  StripeProvider,
  STRIPE_PROVIDER,
  LocalTunnelProvider,
  XLFi18nProvider,
  SendGridMailProvider
} from '@core/api';
import { I18N_PROVIDER } from 'libs/shared/src/api/data-client/tokens';
import { Token } from 'typedi';
import { Configuration } from './configuration.entity';
import { SUPPORTED_LOCALES } from './locales';
import path from 'path';

// Hold this off until the logger is instatiated, hacky :/
export const instantiateProviders = () => {
  const map = new Map<Token<any>, Provider>([
    [
      I18N_PROVIDER,
      new XLFi18nProvider({
        locales: SUPPORTED_LOCALES,
        path: path.join(__dirname, 'i18n')
      })
    ],
    [SSE_HUB_PROVIDER, new SSEHubManagerProvider()],
    [
      MUX_PROVIDER,
      new MuxProvider({
        access_token: Env.MUX.ACCESS_TOKEN,
        secret_key: Env.MUX.SECRET_KEY,
        webhook_signature: Env.MUX.WEBHOOK_SIGNATURE,
        data_env_key: Env.MUX.DATA_ENV_KEY
      })
    ],
    [
      POSTGRES_PROVIDER,
      new PostgresProvider(
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
      )
    ],
    [
      REDIS_PROVIDER,
      new RedisProvider({
        host: Env.REDIS.HOST,
        port: Env.REDIS.PORT
      })
    ],
    [
      STORE_PROVIDER,
      new StoreProvider({
        host: Env.STORE.HOST,
        port: Env.STORE.PORT,
        ttl: Env.STORE.TTL,
        redis_token: REDIS_PROVIDER
      })
    ],
    [
      STRIPE_PROVIDER,
      new StripeProvider({
        public_key: Env.STRIPE.PUBLIC_KEY,
        private_key: Env.STRIPE.PRIVATE_KEY,
        webhook_signature: Env.STRIPE.WEBHOOK_SIGNATURE,
        client_id: Env.STRIPE.CLIENT_ID
      })
    ],
    [
      EMAIL_PROVIDER,
      new SendGridMailProvider({
        api_key: Env.EMAIL.API_KEY,
        enabled: Env.EMAIL.ENABLED
      })
    ],
    [
      BLOB_PROVIDER,
      new GCPBlobProvider({
        bucket_name: Env.GOOGLE_STORAGE.BUCKET_NAME,
        public_url: Env.GOOGLE_STORAGE.PUBLIC_URL,
        service_account_email: Env.GOOGLE_STORAGE.SERVICE_ACCOUNT_EMAIL,
        service_account_key: Env.GOOGLE_STORAGE.SERVICE_ACCOUNT_KEY
      })
    ],
    [EVENT_BUS_PROVIDER, new RxmqEventBus({})],
    // Use HTTP tunnelling in development/testing for receiving webhooks without the need
    // to port forward routers
    [
      HTTP_TUNNEL_PROVIDER,
      Env.IS_LOCAL &&
        new LocalTunnelProvider({
          port: Env.LOCALTUNNEL.PORT,
          domain: Env.LOCALTUNNEL.DOMAIN
        })
    ],
    [
      JOB_QUEUE_PROVIDER,
      new JobQueueProvider({
        redis_host: Env.REDIS.HOST,
        redis_port: Env.REDIS.PORT
      })
    ]
  ]);

  // Remove any undefined entries from the map
  for (const [token, provider] of map.entries()) {
    if (!provider) map.delete(token);
  }

  return map;
};
