import 'reflect-metadata'; // MUST BE AT THE TOP!
import {
  EVENT_BUS_PROVIDER,
  patchTypeORM,
  STORE_PROVIDER,
  STRIPE_PROVIDER,
  WinstonLogger,
  Event,
  ø,
  LOGGING_PROVIDER
} from '@core/api';
import { Environment } from '@core/interfaces';
import session from 'express-session';
import { Container } from 'typedi';
import Auth from './common/authorisation';
import { Configuration } from './common/configuration.entity';
import { instantiateProviders as providers } from './common/providers';
import Env from './env';
import { modules } from './modules';
import routes from './routes';
import { Seeder } from './seeder';
import { getConnection } from 'typeorm';

ø(
  {
    name: 'Backend',
    port: Env.BACKEND.PORT,
    endpoint: Env.BACKEND.ENDPOINT,
    providers: providers,
    logging: new WinstonLogger({ service_name: 'backend' }),
    environment: Env.ENVIRONMENT,
    authorisation: Auth.isSiteAdmin,
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
  },
  async app => {
    const log = Container.get(LOGGING_PROVIDER);
    const configuration = (await Configuration.findOne({})) || new Configuration();
    await configuration.setup();

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
        store: Container.get(STORE_PROVIDER)
      })
    );

    // Patch TypeORM with pagination & register API routes
    app.use(patchTypeORM);

    // Attach all event handlers to event bus
    const bus = Container.get(EVENT_BUS_PROVIDER);

    modules.forEach(module => {
      log.info(`Attaching ${module.name} events...`);
      if (module.events) {
        const events = Container.get(module.events);
        Object.entries(events.events).forEach(([event, handler]) =>
          // bind class context to referenced handler fns
          bus.subscribe(event as Event, handler.bind(events))
        );
      }
    });

    // Run the seeder in staging, for branch & staging deploys
    if (Env.isEnv([Environment.Staging, Environment.Development]) && configuration.is_seeded == false) {
      // seeder will wipe config momentarily, but stored in memory & will be saved again
      const seeder = new Seeder(Container.get(STRIPE_PROVIDER));
      await seeder.run();

      configuration.is_seeded = true;
      await configuration.save();
    }

    return routes;
  }
);
