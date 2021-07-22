import session from 'express-session';
import connectRedis, { RedisStore } from 'connect-redis';
import { ProviderMap, Provider } from '../';
export interface IStoreProviderConfig {
  host: string;
  port: number;
  ttl: number;
  redis_key?: string;
}

import { Service } from 'typedi';
@Service()
export default class StoreProvider implements Provider<RedisStore> {
  name = 'Store';
  connection: RedisStore;
  config: IStoreProviderConfig;

  constructor(config: IStoreProviderConfig) {
    this.config = config;
  }

  async connect(providerMap: ProviderMap) {
    this.connection = new (connectRedis(session))({
      client: this.config.redis_key ? providerMap[this.config.redis_key].connection : providerMap.redis.connection,
      host: this.config.host,
      port: this.config.port,
      ttl: this.config.ttl
    });

    return this.connection;
  }

  async disconnect() {
    return;
  }

  async drop() {
    await new Promise(resolve => {
      this.connection.clear(resolve);
    });
  }
}
