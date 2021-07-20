import { HostAnalytics, patchTypeORM, PerformanceAnalytics, Register } from '@core/api';
import { timeout, timestamp } from '@core/helpers';
import { Environment } from '@core/interfaces';
import session from 'express-session';
import { i18nProvider } from 'libs/shared/src/api/i18n';
import path from 'path';
import 'reflect-metadata';
import { Container } from 'typedi';
import Auth from './common/authorisation';
import { SUPPORTED_LOCALES } from './common/locales';
import { log as logger, stream } from './common/logger';
import providers, { BackendProviderMap, PROVIDERS as token } from './common/providers';
import Env from './env';
import { QueueModule } from './modules/queue/queue.module';
import { SSEModule } from './modules/sse/sse.module';
import routes from './routes';

export type BackendModules = {
  SSE: SSEModule;
  Queue: QueueModule;
};

Register<BackendProviderMap>({
  name: 'Backend',
  port: Env.BACKEND.PORT,
  logging: { logger, stream },
  endpoint: Env.BACKEND.ENDPOINT,
  providers: { providers, token },
  environment: Env.ENVIRONMENT,
  authorisation: Auth.isSiteAdmin,
  i18n: {
    locales: SUPPORTED_LOCALES,
    path: path.join(__dirname, 'i18n')
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
})(async (app, providers) => {
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
    logger
  ).register(providers.bus, {
    i18n: i18n,
    email: providers.email,
    orm: providers.torm,
    stripe: providers.stripe,
    bus: providers.bus
  });

  const SSE = await new SSEModule(logger).register(providers.bus, {
    i18n: i18n,
    email: providers.email,
    orm: providers.torm
  });

  return routes({
    Queue: Queue.routes,
    SSE: SSE.routes
  });
});
