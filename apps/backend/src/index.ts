import express from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';
import session, { MemoryStore } from 'express-session';
import log, { stream } from './common/logger';
import http from 'http';
import helmet from 'helmet';

import { Environment, ErrCode, HTTP } from '@core/interfaces';
import { handleError, ErrorHandler } from './common/errors';
import { DataClient, DataProvider } from './common/data';
import { pagination } from './common/paginate';
import Routes from './routes';
import config from './config';

console.log('\nBackend running in env: \u001B[04m' + config.ENVIRONMENT + '\u001B[0m\n');

let server: http.Server;
const app = express();
app.set('trust proxy', 1);
app.use(bodyParser.json());
app.use(cors());
app.use(helmet());
app.use(morgan('tiny', { stream }));


(async () => {
  try {
    // Connect to all the databases
    const providers = await DataProvider.create();

    // Register Redis session store
    app.use(
      session({
        secret: config.PRIVATE_KEY,
        resave: false,
        saveUninitialized: true,
        cookie: {
          httpOnly: config.isEnv(Environment.Production),
          secure: config.isEnv(Environment.Production)
        },
        store: config.USE_MEMORYSTORE ? new MemoryStore() : providers.session_store
      })
    );

    // Register routes
    app.use(pagination);
    app.use('/', Routes(providers).router);

    // Catch 404 errors
    app.all('*', (req, res, next) => {
      handleError(req, res, next, new ErrorHandler(HTTP.NotFound, ErrCode.NOT_FOUND));
    });

    // Global error handler
    app.use((err: any, req: any, res: any, next: any) => {
      handleError(req, res, next, err);
    });

    // Handle closing connections on failure
    process.on('SIGTERM', gracefulExit(providers));
    process.on('SIGINT', gracefulExit(providers));
    process.on('uncaughtException', gracefulExit(providers));

    // Start listening for requests
    server = app.listen(config.EXPRESS_PORT, () => {
      log.info(`\u001B[1mExpress listening on ${config.EXPRESS_PORT}\u001B[0m`);
    });
  } catch (error: unknown) {
    log.error(error);
  }
})();

function gracefulExit(providers: DataClient) {
  return (error: any) => {
    log.info('Termination requested, closing all connections');
    server.close();
    console.log(error);
    DataProvider.close(providers);
    process.exit(1);
  };
}

export default {
  app,
  gracefulExit
};
