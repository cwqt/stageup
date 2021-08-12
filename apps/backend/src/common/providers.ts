import Env from '@backend/env';
import { JobQueueProvider, JOB_QUEUE_PROVIDER } from '@backend/modules/queue/queue.provider';
import {
  BLOB_PROVIDER,
  EMAIL_PROVIDER,
  EVENT_BUS_PROVIDER,
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
  S3BlobProvider,
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
export const instantiateProviders = () =>
  new Map<Token<any>, Provider>([
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
      new S3BlobProvider({
        s3_access_key_id: Env.AWS.S3_ACCESS_KEY_ID,
        s3_access_secret_key: Env.AWS.S3_ACCESS_SECRET_KEY,
        s3_bucket_name: Env.AWS.S3_BUCKET_NAME,
        s3_url: Env.AWS.S3_URL,
        s3_region: Env.AWS.S3_REGION
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
