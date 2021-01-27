import winston from 'winston';

const logger = winston.createLogger({
  level: 'silly',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

logger.add(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        http: 'magenta',
        verbose: 'cyan',
        debug: 'blue',
        silly: 'magenta'
      }}),
      winston.format.printf(info => {
        return info.message
          ? `[${info.level}]: ${typeof info.message == 'object' ? JSON.stringify(info.message, null, 2) : info.message}`
          : 'No error message given';
      }
      )
    ),
  })
);

export const stream = {
  //https://stackoverflow.com/questions/40602106/how-to-remove-empty-lines-that-are-being-generated-in-a-log-file-from-morgan-log
  write: (message: string) => logger.http(message.substring(0, message.lastIndexOf('\n')))
};

export default logger;
