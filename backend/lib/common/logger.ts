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
      winston.format.colorize(),
      winston.format.printf((info: any) =>
        info.message
          ? `[${info.level}]: ${typeof info.message == 'object' ? JSON.stringify(info.message, null, 2) : info.message}`
          : 'No error message given'
      )
    ),
  })
);

export const stream = {
  write: (message: string) => {
    logger.info(message);
  },
};

export default logger;
