import { RedisClient, createClient } from 'redis';
import { Provider } from '../';

export interface IRedisProviderConfig {
  host: string;
  port: number;
}

export default class RedisProvider implements Provider<RedisClient> {
  name = 'Redis';
  connection: RedisClient;
  config: IRedisProviderConfig;

  constructor(config: IRedisProviderConfig) {
    this.config = config;
  }

  async connect() {
    this.connection = createClient({
      host: this.config.host,
      port: this.config.port
    });

    return new Promise<RedisClient>((resolve, reject) => {
      this.connection.on('connect', () => {
        resolve(this.connection);
      });
      this.connection.on('error', reject);
    });
  }

  async disconnect() {
    return this.connection.end();
  }

  async drop () {
    await new Promise(resolve => this.connection.flushdb(resolve));
  }
}
