import 'reflect-metadata';
import { patchTypeORM, PerformanceAnalytics, PG_MODELS, ProviderMap, Providers, Register } from '@core/api';
import { Environment, ILocale } from '@core/interfaces';
import { i18nProvider } from 'libs/shared/src/api/i18n';
import { Container } from 'typedi';
import { log as logger, stream } from './common/logger';
import { QueueModule } from './modules/queue/queue.module';
import { SSEModule } from './modules/sse/sse.module';
import session from 'express-session';
import path from 'path';
import Auth from './common/authorisation';
import Env from './env';
import routes from './routes';
import providers, { BackendProviderMap } from './common/providers';
import { SUPPORTED_LOCALES } from './common/locales';
import { random, timeout } from '@core/helpers';

export type BackendModules = {
  SSE: SSEModule;
  Queue: QueueModule;
};

Register<BackendProviderMap>({
  name: 'Backend',
  port: Env.BACKEND.PORT,
  logging: { logger, stream },
  endpoint: Env.BACKEND.ENDPOINT,
  providers: providers,
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

  // await PerformanceAnalytics.clear();
  // await Queue.queues.collect_analytics.queue.obliterate();
  // Queue.queues.collect_analytics.add(
  //   { performance_id: 'qRjKzCjGbPd' },
  //   {
  //     repeat: { every: 86400000, immediately: true } // 7 days in milliseconds
  //   }
  // );

  // await timeout(1000);
  // const anal = await (await PerformanceAnalytics.find({ relations: { performance: true } })).pop();
  // console.log(anal);

  // for (let i = 1; i < 28; i++) {
  //   const offset = i * 604800; //  1 week in seconds
  //   const newAnal = new PerformanceAnalytics(anal.performance, {
  //     period_start: anal.period_start - offset,
  //     period_end: anal.period_end - offset
  //   });
  //   newAnal.metrics = { ...anal.metrics };
  //   newAnal.metrics.total_ticket_sales = 28 + (i / 2) * Math.cos(((2 * Math.PI) / 2) * i);
  //   newAnal.metrics.total_revenue = anal.metrics.total_revenue + 10000 / i;

  //   newAnal.collection_started_at = anal.collection_started_at;
  //   newAnal.collection_ended_at = anal.collection_ended_at;
  //   await newAnal.save();
  // }

  return routes({
    Queue: Queue.routes,
    SSE: SSE.routes
  });
});
