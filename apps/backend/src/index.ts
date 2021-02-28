import session from 'express-session';
import { Environment } from '@core/interfaces';
import { Register, Router } from '@core/shared/api';

import Env from './env';
import Auth from './common/authorisation';
import routes from './routes';
import providers, { BackendDataClient } from './common/data';
import { pagination } from './common/paginate';
import { log, stream } from './common/logger';

Register<BackendDataClient>({
  name: 'Backend',
  providers: providers.create(),
  environment: Env.ENVIRONMENT,
  port: Env.EXPRESS_PORT,
  logger: log,
  stream: stream
})(async (app, client) => {
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
      store: client.connections.store
    })
  );

  // Patch TypeORM with pagination & register API routes
  app.use(pagination);

  return Router(
    client,
    Auth.or(Auth.isSiteAdmin, Auth.isFromService),
    { redis: client.connections.redis },
    log
  )(routes);
});
