import redis from 'redis';
import session from 'express-session';
import config from '../../config';
import connectRedis from 'connect-redis';
import log from '../logger';

export const create = async (): Promise<redis.RedisClient | null> => {
  log.info(`Connecting to Redis...`);

  if (config.USE_MEMORYSTORE) {
    log.info(`.env set to use MemoryStore, skipping Redis setup`);
    return null;
  }

  if (!config.REDIS.HOST) throw new Error('Missing .env REDIS_HOST');
  if (!config.REDIS.PORT) throw new Error('Missing .env REDIS_PORT');
  if (!config.REDIS.TTL) throw new Error('Missing .env REDIS_TTL');

  const redisClient = redis.createClient({
    host: config.REDIS.HOST,
    port: config.REDIS.PORT
  });

  return new Promise<redis.RedisClient>((resolve, reject) => {
    redisClient.on('connect', () => resolve(redisClient));
    redisClient.on('error', reject);
  });
};

export const store = (client: redis.RedisClient) => {
  return async (): Promise<connectRedis.RedisStore> => {
    log.info(`Creating Redis Store...`);

    return new (connectRedis(session))({
      client,
      host: config.REDIS.HOST,
      port: config.REDIS.PORT,
      ttl: config.REDIS.TTL
    });
  };
};

export default { create, store };
