import session, { MemoryStore } from 'express-session';
import connectRedis, { RedisStore } from 'connect-redis';
import { ProviderMap, Provider } from '../';
export interface IStoreProviderConfig {
  host: string;
  port: number;
  ttl: number;
  use_memorystore?: boolean;
  redis_key?: string;
}

export default class StoreProvider implements Provider<RedisStore | MemoryStore> {
  name = 'Store';
  connection: RedisStore | MemoryStore;
  config: IStoreProviderConfig;

  constructor(config: IStoreProviderConfig) {
    this.config = config;
  }

  async connect(providerMap: ProviderMap) {
    if (this.config.use_memorystore) {
      this.connection = new MemoryStore();
    } else {
      this.connection = new (connectRedis(session))({
        client: this.config.redis_key ? providerMap[this.config.redis_key].connection : providerMap.redis.connection,
        host: this.config.host,
        port: this.config.port,
        ttl: this.config.ttl
      });
    }

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
