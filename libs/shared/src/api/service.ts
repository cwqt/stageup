import { DataClient, global404Handler, globalErrorHandler } from '@core/api';
import { Environment } from '@core/interfaces';
import { json, OptionsJson } from 'body-parser';
import cors, { CorsOptions } from 'cors';
import express from 'express';
import createLocaleMiddleware from 'express-locale';
import helmet from 'helmet';
import http from 'http';
import morgan from 'morgan';
import qs from 'qs';
import { Container, Token } from 'typedi';
import { Logger } from 'winston';
import { AuthStrategy } from './authorisation';
import { ProviderMap } from './data-client';
import { i18nProvider, Ii18nConfig } from './i18n';
import { AsyncRouter, Routes } from './router';

export interface IServiceConfig<T extends ProviderMap> {
  name: string;
  environment: Environment;
  port: number;
  providers: { providers: T; token: Token<T> };
  logging: { logger: Logger; stream: morgan.StreamOptions };
  authorisation: AuthStrategy;
  endpoint: string;
  i18n: Ii18nConfig;
  options?: {
    body_parser?: OptionsJson;
    cors?: CorsOptions;
    helmet?: any;
  };
}

export default <T extends ProviderMap>(config: IServiceConfig<T>) => {
  config.logging.logger.log('info', `Application running in \u001B[1m${config.environment}\u001B[0m`);

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
  app.use(morgan('tiny', { stream: config.logging.stream }));
  if (config.i18n) app.use(createLocaleMiddleware({ priority: ['accept-language', 'default'] }));

  return async (
    setup: (a: typeof app, providers: T, router: AsyncRouter<T>, config: IServiceConfig<T>) => Promise<Routes<T> | void>
  ): Promise<http.Server> => {
    try {
      const providers = await DataClient.connect(config.providers.providers, config.logging.logger);
      const i18n = config.i18n && (await new i18nProvider(config.i18n).setup(config.logging.logger));

      // Dependency Injection
      Container.set('i18n', i18n);
      Container.set(config.providers.token, providers);

      const router = new AsyncRouter(providers, config.authorisation, config.logging.logger, i18n);
      const routes = await setup(app, providers, router, config);

      if (routes) app.use(config.endpoint ? `${config.endpoint}` : '/', router.register(routes));

      // Catch 404 errors & provide a top-level error handler
      app.all('*', global404Handler(config.logging.logger, i18n));
      app.use(globalErrorHandler(config.logging.logger, i18n));

      server = app.listen(config.port, () =>
        config.logging.logger.info(
          `\u001B[1m${config.name} listening on ${config.port}\u001B[0m at ${config.endpoint || '/'}`
        )
      );

      process.on('SIGTERM', gracefulExit(server, providers, config.logging.logger));
      process.on('SIGINT', gracefulExit(server, providers, config.logging.logger));
      process.on('uncaughtException', gracefulExit(server, providers, config.logging.logger));

      return server;
    } catch (error) {
      config.logging.logger.error(error);
      console.error(error);
    }
  };
};

function gracefulExit(server: http.Server, providerMap: ProviderMap, logger: Logger) {
  return error => {
    logger.error('Termination requested, closing all connections');
    server.close();
    console.log(error);
    DataClient.disconnect(providerMap);
    process.exit(1);
  };
}
