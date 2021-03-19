import session from 'express-session';
import { Environment } from '@core/interfaces';
import { PG_MODELS, ProviderMap, Providers, Register, Router } from '@core/shared/api';

import Env from './env';
import Auth from './common/authorisation';
import routes from './routes';
import { pagination } from './common/paginate';
import { log, stream } from './common/logger';

export interface BackendProviderMap extends ProviderMap {
  torm: InstanceType<typeof Providers.Postgres>;
  mux: InstanceType<typeof Providers.Mux>;
  redis: InstanceType<typeof Providers.Redis>;
  store: InstanceType<typeof Providers.Store>;
  stripe: InstanceType<typeof Providers.Stripe>;
  s3: InstanceType<typeof Providers.S3>;
  tunnel?: InstanceType<typeof Providers.LocalTunnel>;
}

Register<BackendProviderMap>({
  name: 'Backend',
  environment: Env.ENVIRONMENT,
  port: Env.EXPRESS_PORT,
  endpoint: Env.API_ENDPOINT,
  logger: log,
  stream: stream,
  provider_map: {
    mux: new Providers.Mux({
      access_token: Env.MUX.ACCESS_TOKEN,
      secret_key: Env.MUX.SECRET_KEY,
      image_api_endpoint: Env.MUX.IMAGE_API_ENDPOINT,
      hook_signature: Env.MUX.HOOK_SIGNATURE
    }),
    torm: new Providers.Postgres(
      {
        host: Env.PG.HOST,
        port: Env.PG.PORT,
        username: Env.PG.USERNAME,
        password: Env.PG.PASSWORD,
        database: Env.PG.DATABASE,
        // Re-sync in test, dev & staging - prod use migrations
        synchronize: !Env.isEnv(Environment.Production)
      },
      PG_MODELS
    ),
    redis: new Providers.Redis({
      host: Env.REDIS.HOST,
      port: Env.REDIS.PORT
    }),
    store: new Providers.Store({
      host: Env.STORE.HOST,
      port: Env.STORE.PORT,
      ttl: Env.STORE.TTL,
      use_memorystore: Env.STORE.USE_MEMORYSTORE
    }),
    stripe: new Providers.Stripe({
      public_key: Env.STRIPE.PUBLIC_KEY,
      private_key: Env.STRIPE.PRIVATE_KEY,
      hook_signature: Env.STRIPE.HOOK_SIGNATURE
    }),
    s3: new Providers.S3({
      s3_access_key_id: Env.AWS.S3_ACCESS_KEY_ID,
      s3_access_secret_key: Env.AWS.S3_ACCESS_SECRET_KEY,
      s3_bucket_name: Env.AWS.S3_BUCKET_NAME,
      s3_url: Env.AWS.S3_URL,
      s3_region: Env.AWS.S3_REGION
    }),
    // Use HTTP tunnelling in development for receiving hooks
    tunnel: Env.isEnv([Environment.Production, Environment.Staging])
      ? null
      : new Providers.LocalTunnel({
          port: Env.LOCALTUNNEL.PORT,
          domain: new URL(Env.WEBHOOK_URL).hostname.split('.').shift()
        })
  }
})(async (app, pm) => {
  // Register session middleware
  app.use(
    session({
      secret: Env.PRIVATE_KEY,
      resave: false,
      saveUninitialized: true,
      cookie: {
        httpOnly: Env.isEnv(Environment.Production),
        secure: Env.isEnv(Environment.Production)
      },
      store: pm.store.connection
    })
  );

  // Patch TypeORM with pagination & register API routes
  app.use(pagination);

  return Router(pm, Auth.or(Auth.isSiteAdmin, Auth.isFromService), { redis: pm.redis.connection }, log)(routes);
});
