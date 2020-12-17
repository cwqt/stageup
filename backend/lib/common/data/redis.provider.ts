import redis from "redis";
import session from "express-session";
import config from "../../config";
import connectRedis from "connect-redis";
import log from '../logger';

export const create = async () => {
  log.info(`Connecting to Redis...`);

  if (!config.REDIS.HOST) throw new Error("No Redis url found.");

  const redisClient = redis.createClient({
    host: config.REDIS.HOST,
    port: config.REDIS.PORT
  });

  return new Promise<redis.RedisClient>((resolve, reject) => {
    redisClient.on("connect", () => resolve(redisClient));
    redisClient.on("error", reject);
  });
};

export const store = (client: redis.RedisClient) => {
  return async ():Promise<connectRedis.RedisStore> => {
    log.info(`Creating Redis Store...`);

    const redisStore = connectRedis(session);
  
    return new redisStore({
      client: client,
      host: config.REDIS.HOST,
      port: config.REDIS.PORT,
      ttl: config.REDIS.TTL,
    });  
  }
};

export default { create, store };
