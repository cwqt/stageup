import winston from 'winston';
import config from '../config';

const logger = winston.createLogger({
  level: 'silly',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

logger.add(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(info => (info.message ? `[${info.level}]: ${info.message.trim()}` : ''))
    )
  })
);

export const stream = {
  write: (message: string) => {
    logger.info(message);
  }
};

export default logger;
