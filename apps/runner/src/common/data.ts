import { ProviderMap, Providers } from '@core/shared/api';

import { RedisClient } from 'redis';
import { Connection } from 'typeorm';
import Env from '../env';

export interface RunnerDataClient {
  redis: RedisClient;
}

export const create = (): ProviderMap<RunnerDataClient> => {
  return {
    redis: new Providers.Redis({
      host: Env.REDIS.host,
      port: Env.REDIS.port
    }),
  };
};

export default { create };
