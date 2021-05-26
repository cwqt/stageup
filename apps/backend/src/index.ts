import { patchTypeORM, PG_MODELS, ProviderMap, Providers, Register } from '@core/api';
import { Environment } from '@core/interfaces';
import { Topic } from '@google-cloud/pubsub';
import session from 'express-session';
import path from 'path';
import 'reflect-metadata';
import Auth from './common/authorisation';
import { log, stream } from './common/logger';
import Env from './env';
import routes from './routes';

import { QueueModule } from './modules/queue/queue.module';
import { SSEModule } from './modules/sse/sse.module';
import { Container } from 'typedi';
import { i18nProvider } from 'libs/shared/src/api/i18n';

export interface BackendProviderMap extends ProviderMap {
  torm: InstanceType<typeof Providers.Postgres>;
  mux: InstanceType<typeof Providers.Mux>;
  redis: InstanceType<typeof Providers.Redis>;
  store: InstanceType<typeof Providers.Store>;
  stripe: InstanceType<typeof Providers.Stripe>;
  blob: InstanceType<typeof Providers.Blob>;
  tunnel?: InstanceType<typeof Providers.LocalTunnel>;
  email: InstanceType<typeof Providers.Email>;
  bus: InstanceType<typeof Providers.EventBus>;
}

export type BackendModules = {
  SSE: SSEModule;
  Queue: QueueModule;
};

Register<BackendProviderMap>({
  name: 'Backend',
  environment: Env.ENVIRONMENT,
  port: Env.BACKEND.PORT,
  endpoint: Env.BACKEND.ENDPOINT,
  logger: log,
  stream: stream,
  i18n: {
    locales: ['en', 'nb'],
    path: path.join(__dirname, '/i18n')
  },
  authorisation: Auth.isSiteAdmin,
  providers: {
    mux: new Providers.Mux({
      access_token: Env.MUX.ACCESS_TOKEN,
      secret_key: Env.MUX.SECRET_KEY,
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
      ttl: Env.STORE.TTL
    }),
    stripe: new Providers.Stripe({
      public_key: Env.STRIPE.PUBLIC_KEY,
      private_key: Env.STRIPE.PRIVATE_KEY,
      hook_signature: Env.STRIPE.HOOK_SIGNATURE,
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
    // Use HTTP tunnelling in development for receiving webhooks
    tunnel: Env.isEnv([Environment.Production, Environment.Staging])
      ? null
      : new Providers.LocalTunnel({
          port: Env.LOCALTUNNEL.PORT,
          domain: Env.LOCALTUNNEL.DOMAIN
        })
  },
  options: {
    body_parser: {
      // stripe hook signature verifier requires raw, un-parsed body
      verify: function (req, _, buf) {
        if (req.url.startsWith('/stripe/hooks') || req.url.startsWith('/mux/hooks')) {
          (req as any).rawBody = buf.toString();
        }
      }
    }
  }
})(async (app, providers, router) => {
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
      store: providers.store.connection
    })
  );

  // Patch TypeORM with pagination & register API routes
  app.use(patchTypeORM);

  // Dependency Injection
  const i18n: InstanceType<typeof i18nProvider> = Container.get('i18n');

  // Register all the modules
  const Queue = await new QueueModule(
    { redis: { host: providers.redis.config.host, port: providers.redis.config.port } },
    log
  ).register(providers.bus, { i18n, email: providers.email, orm: providers.torm, stripe: providers.stripe });

  const SSE = await new SSEModule(log).register(providers.bus, {
    i18n: i18n,
    email: providers.email,
    orm: providers.torm
  });

  return routes({
    Queue: Queue.routes,
    SSE: SSE.routes
  });
});
