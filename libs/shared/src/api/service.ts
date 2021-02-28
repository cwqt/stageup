import cors from 'cors';
import http from 'http';
import morgan from 'morgan';
import helmet from 'helmet';
import express from 'express';
import { json } from 'body-parser';
import { Provider, ProviderMap, globalErrorHandler, global404Handler, DataClient } from '@core/shared/api';
import { Logger } from 'winston';
import { Environment } from '@core/interfaces';
import { AsyncRouter } from './router';

export interface IServiceConfig<T> {
  name: string;
  environment: Environment;
  port: number;
  providers: ProviderMap<T>;
  logger: Logger;
  stream: morgan.StreamOptions;
  endpoint?: string;
}

export default <T>(config: IServiceConfig<T>) => {
  // console.clear();
  console.log(`\nRegistering service '${config.name}', running in env: \u001B[04m${config.environment}\u001B[0m\n`);

  let server: http.Server;
  const app = express();

  app.set('trust proxy', 1);
  app.use(json());
  app.use(cors());
  app.use(helmet());
  app.use(morgan('tiny', { stream: config.stream }));

  return async (f: (a: typeof app, client: DataClient<T>) => Promise<AsyncRouter<T>>): Promise<http.Server> => {
    try {
      const client = await Provider.create(config.providers, config.logger);
      const router = await f(app, client);
      app.use('/' + config.endpoint || '/', router.router);

      // Catch 404 errors & provide a top-level error handler
      app.all('*', global404Handler(config.logger));
      app.use(globalErrorHandler(config.logger));

      server = app.listen(config.port, () =>
        config.logger.info(`\u001B[1m${config.name} listening on ${config.port}\u001B[0m`)
      );

      process.on('SIGTERM', gracefulExit(server, client.providers, config.logger));
      process.on('SIGINT', gracefulExit(server, client.providers, config.logger));
      process.on('uncaughtException', gracefulExit(server, client.providers, config.logger));

      return server;
    } catch (error) {
      config.logger.error(error);
    }
  };
};

function gracefulExit<T>(server: http.Server, providers: ProviderMap<T>, logger: Logger) {
  return error => {
    logger.error('Termination requested, closing all connections');
    server.close();
    console.log(error);
    Provider.close(providers);
    process.exit(1);
  };
}
