import redis from 'redis';
import session from 'express-session';
import Env from '../../env';
import connectRedis from 'connect-redis';
import log from '../logger';

export const create = async (): Promise<redis.RedisClient | null> => {
  log.info('Connecting to Redis...');

  if (Env.USE_MEMORYSTORE) {
    log.info('.env set to use MemoryStore, skipping Redis setup');
    return null;
  }

  if (!Env.REDIS.HOST) {
    throw new Error('Missing .env REDIS_HOST');
  }

  if (!Env.REDIS.PORT) {
    throw new Error('Missing .env REDIS_PORT');
  }

  if (!Env.REDIS.TTL) {
    throw new Error('Missing .env REDIS_TTL');
  }

  const redisClient = redis.createClient({
    host: Env.REDIS.HOST,
    port: Env.REDIS.PORT
  });

  return new Promise<redis.RedisClient>((resolve, reject) => {
    redisClient.on('connect', () => {
      resolve(redisClient);
    });
    redisClient.on('error', reject);
  });
};

export const store = (client: redis.RedisClient) => {
  return async (): Promise<connectRedis.RedisStore> => {
    log.info('Creating Redis Store...');

    return new (connectRedis(session))({
      client: client,
      host: Env.REDIS.HOST,
      port: Env.REDIS.PORT,
      ttl: Env.REDIS.TTL
    });
  };
};

export default { create, store };
