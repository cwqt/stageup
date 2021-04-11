import { createLogger, transports, format } from 'winston';
import colors = require('colors');

export const apiLogger = (service: string, color?: string, formatter?: (value: string) => string) => {
  const logger = createLogger({
    level: 'silly',
    format: format.json(),
    transports: [
      new transports.File({ filename: 'logs/error.log', level: 'error' }),
      new transports.File({ filename: 'logs/combined.log' })
    ]
  });

  logger.add(
    new transports.Console({
      format: format.combine(
        format.splat(),
        format.errors({ stack: true }),
        format.colorize({
          colors: {
            error: 'red',
            warn: 'yellow',
            info: 'green',
            http: 'magenta',
            verbose: 'cyan',
            debug: 'blue',
            silly: 'magenta'
          }
        }),
        format.printf(info => {
          const message = info.message
            ? `${clr(service, color)} [${info.level}]: ${info.message}${info.stack ? '\n' + info.stack : ''}`
            : `${clr(service, color)} No error message given`;

          return formatter ? formatter(message) : message;
        })
      )
    })
  );

  return {
    log: logger,
    stream: {
      //https://stackoverflow.com/questions/40602106/how-to-remove-empty-lines-that-are-being-generated-in-a-log-file-from-morgan-log
      write: (message: string) => logger.http(message.substring(0, message.lastIndexOf('\n')))
    }
  };
};

const clr = (str, color) => colors[color || 'gray'](str + ' '.repeat(8).slice(str.length - 8) + ' |');
