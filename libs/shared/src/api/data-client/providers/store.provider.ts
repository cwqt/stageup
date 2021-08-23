import connectRedis, { RedisStore } from 'connect-redis';
import session from 'express-session';
import { Service, Token } from 'typedi';
import { Provider, ProviderMap } from '../';
export interface IStoreProviderConfig {
  host: string;
  port: number;
  ttl: number;
  redis_token: Token<string>;
}

@Service()
export class StoreProvider implements Provider<RedisStore> {
  name = 'Store';
  connection: RedisStore;
  config: IStoreProviderConfig;

  constructor(config: IStoreProviderConfig) {
    this.config = config;
  }

  async connect(map: ProviderMap) {
    this.connection = new (connectRedis(session))({
      client: map.get(this.config.redis_token).connection,
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
