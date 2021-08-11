import { Service } from 'typedi';
import { Logger as Winston } from 'winston';
import { apiLogger } from '../../logger';
import { Provider } from '../index';

export interface ILoggerConfiguration {
  service_name: string;
}

export interface Logger {
  error: (message: string, object?: any) => void;
  warn: (message: string, object?: any) => void;
  info: (message: string, object?: any) => void;
  http: (message: string, object?: any) => void;
  verbose: (message: string, object?: any) => void;
  debug: (message: string, object?: any) => void;
  silly: (message: string, object?: any) => void;

  stream: { write: (message: string) => Winston };
}

@Service()
export class WinstonLogger implements Provider<Logger> {
  name = 'Winston';
  config: ILoggerConfiguration;
  connection: Logger;

  constructor(config: ILoggerConfiguration) {
    this.config = config;
  }

  async connect() {
    const { log, stream } = apiLogger(this.config.service_name);
    this.connection = {
      info: log.info.bind(log),
      error: log.error.bind(log),
      warn: log.warn.bind(log),
      verbose: log.verbose.bind(log),
      http: log.http.bind(log),
      debug: log.debug.bind(log),
      silly: log.silly.bind(log),

      stream: stream
    };

    return this.connection;
  }

  async disconnect() {}
}
