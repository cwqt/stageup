import express from 'express';
import morgan from 'morgan';
import { json } from 'body-parser';
import cors from 'cors';
import log, { stream } from './common/logger';
import http from 'http';
import helmet from 'helmet';

import { ErrCode, HTTP } from '@core/interfaces';
import { globalErrorHandler, handleError, ErrorHandler } from './common/errors';
import { DataClient, DataProvider } from './common/data';
import { pagination } from './common/paginate';
import Routes from './routes';
import Env from './env';

console.log('\nBackend running in env: \u001B[04m' + Env.ENVIRONMENT + '\u001B[0m\n');

let server: http.Server;
const app = express();
app.set('trust proxy', 1);
app.use(json());
app.use(cors());
app.use(helmet());
app.use(morgan('tiny', { stream }));

(async () => {
  try {
    // Connect to all the databases
    const providers = await DataProvider.create();

    // Register session & pagination middleware, then add API router
    app.use(providers.session_handler);
    app.use(pagination);
    app.use('/', Routes(providers).router);

    // Catch 404 errors & add the global handler
    app.all('*', (req, res, next) => handleError(req, res, next, new ErrorHandler(HTTP.NotFound, ErrCode.NOT_FOUND)));
    app.use(globalErrorHandler);

    // Handle closing connections on failure
    process.on('SIGTERM', gracefulExit(providers));
    process.on('SIGINT', gracefulExit(providers));
    process.on('uncaughtException', gracefulExit(providers));

    // Start listening for requests
    server = app.listen(Env.EXPRESS_PORT, () => log.info(`\u001B[1mExpress listening on ${Env.EXPRESS_PORT}\u001B[0m`));
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
