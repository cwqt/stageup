import cors, { CorsOptions } from 'cors';
import http from 'http';
import morgan from 'morgan';
import helmet from 'helmet';
import express from 'express';
import qs from 'qs';
import { json, OptionsJson } from 'body-parser';
import { globalErrorHandler, global404Handler, DataClient } from '@core/api';
import { Logger } from 'winston';
import { Environment } from '@core/interfaces';
import { AsyncRouter } from './router';
import { ProviderMap } from './data-client';

export interface IServiceConfig<T extends ProviderMap> {
  name: string;
  environment: Environment;
  port: number;
  provider_map: T;
  logger: Logger;
  stream: morgan.StreamOptions;
  endpoint: string;
  options?: {
    body_parser?: OptionsJson;
    cors?: CorsOptions;
    helmet?: any;
  };
}

export default <T extends ProviderMap>(config: IServiceConfig<T>) => {
  config.logger.log('info', `Registering in \u001B[1m${config.environment}\u001B[0m`);

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
  app.use(morgan('tiny', { stream: config.stream }));

  return async (
    Router: (a: typeof app, providerMap: T, config?: IServiceConfig<T>) => Promise<AsyncRouter<T>>
  ): Promise<http.Server> => {
    try {
      const providers = await DataClient.connect(config.provider_map, config.logger);
      const router = await Router(app, providers, config);
      app.use(config.endpoint ? `/${config.endpoint}` : '', router.router);

      // Catch 404 errors & provide a top-level error handler
      app.all('*', global404Handler(config.logger));
      app.use(globalErrorHandler(config.logger));

      server = app.listen(config.port, () =>
        config.logger.info(`\u001B[1m${config.name} listening on ${config.port}\u001B[0m at /${config.endpoint}`)
      );

      process.on('SIGTERM', gracefulExit(server, providers, config.logger));
      process.on('SIGINT', gracefulExit(server, providers, config.logger));
      process.on('uncaughtException', gracefulExit(server, providers, config.logger));

      return server;
    } catch (error) {
      config.logger.error(error);
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
