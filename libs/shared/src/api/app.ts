import { DataClient, global404Handler, globalErrorHandler, Logger, LOGGING_PROVIDER } from '@core/api';
import { Environment } from '@core/interfaces';
import { json, OptionsJson } from 'body-parser';
import cors, { CorsOptions } from 'cors';
import express, { Express } from 'express';
import createLocaleMiddleware from 'express-locale';
import helmet from 'helmet';
import http from 'http';
import morgan from 'morgan';
import qs from 'qs';
import { Container, Token } from 'typedi';
import { AuthStrategy } from './authorisation';
import { Provider, ProviderMap } from './data-client';
import { I18N_PROVIDER } from './data-client/tokens';
import { Module } from './module';
import { AsyncRouter, Routes } from './router';

export interface IServiceConfig<T extends ProviderMap> {
  name: string;
  environment: Environment;
  port: number;
  providers: () => T;
  logging: Provider<Logger>;
  authorisation: AuthStrategy;
  endpoint: string;
  options?: {
    body_parser?: OptionsJson;
    cors?: CorsOptions;
    helmet?: any;
  };
}

type SetupFn = <T extends ProviderMap>(
  express: Express,
  providers: T,
  router: AsyncRouter,
  config: IServiceConfig<T>
) => Promise<Routes | void>;

export default async <T extends ProviderMap>(config: IServiceConfig<T>, setup: SetupFn): Promise<http.Server> => {
  // Immediately attach the logger to DI Container for use in the rest of services/providers
  const log = await config.logging.connect();
  Container.set(LOGGING_PROVIDER, config.logging.connection);

  log.info(`Application running in \u001B[1m${config.environment}\u001B[0m`);

  let server: http.Server;
  const app = express();

  app.set('trust proxy', 1);
  app.set('query parser', q =>
    qs.parse(q, {
      comma: true
    })
  );

  app.use(json(config.options?.body_parser || {}));
  app.use(cors(config.options?.cors || {}));
  app.use(helmet(config.options?.helmet || {}));
  app.use(morgan('tiny', { stream: config.logging.connection.stream }));
  app.use(createLocaleMiddleware({ priority: ['accept-language', 'default'] }));

  try {
    // For each provider in the map, connect them all & set in Container
    const providers = await DataClient.connect(config.providers());

    // Create the router & run the services own setup function
    const router = new AsyncRouter(config.authorisation);
    const routes = await setup(app, providers, router, config);

    // Attach the router to Express
    if (routes) app.use(config.endpoint ? `${config.endpoint}` : '/', router.register(routes));

    // Catch 404 errors & provide a top-level error handler
    app.all('*', global404Handler);
    app.use(globalErrorHandler);

    // Begin listening for incoming connections
    server = app.listen(config.port, () =>
      log.info(`\u001B[1m${config.name} listening on ${config.port}\u001B[0m at ${config.endpoint || '/'}`)
    );

    // Gracefully handle exit codes (close provider connections etc.)
    process.on('SIGTERM', exit(server, providers));
    process.on('SIGINT', exit(server, providers));
    process.on('uncaughtException', exit(server, providers));

    return server;
  } catch (error) {
    log.error(error);
    console.error(error);
  }
};

function exit(server: http.Server, providerMap: ProviderMap) {
  const log = Container.get(LOGGING_PROVIDER);

  return error => {
    log.error('Termination requested, closing all connections');
    server.close();
    console.log(error);
    DataClient.disconnect(providerMap);
    process.exit(1);
  };
}
