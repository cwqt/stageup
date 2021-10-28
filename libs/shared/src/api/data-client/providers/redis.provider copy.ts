import { createClient, RedisClient } from 'redis';
import { Service, Token } from 'typedi';
import { Provider } from '../';

export interface IRedisProviderConfig {
  host: string;
  port: number;
}

export interface AppCache {
  get: (cacheId: string) => Promise<any>;
  set: (cacheId: string, data: any, expiration: number) => Promise<void>;
  delete: (cacheId: string) => Promise<void>;
}

@Service()
export class RedisProvider implements Provider<AppCache> {
  name = 'Redis';
  connection: AppCache;
  client: RedisClient;
  config: IRedisProviderConfig;

  constructor(config: IRedisProviderConfig) {
    this.config = config;
  }

  async connect() {
    this.client = createClient({
      host: this.config.host,
      port: this.config.port
    });

    new Promise<AppCache>((resolve, reject) => {
      this.client.on('connect', () => resolve(this.connection));
      this.client.on('error', reject);
    });

    return this;
  }

  public async get(cacheId: string) {
    return new Promise((resolve, reject) => {
      this.client.get(cacheId, (error, data) => {
        if (error) {
          reject(error);
          return;
        }
        if (data == null) {
          resolve(null);
          return;
        }

        try {
          resolve(JSON.parse(data));
        } catch (ex) {
          resolve(data);
        }
      });
    });
  }

  public async set(cacheId: string, data: any, expiration: number): Promise<void> {
    try {
      this.client.setex(cacheId, expiration, JSON.stringify(data));
    } catch (error) {
      console.log(error);
    }
  }

  public async delete(cacheId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.del(cacheId, () => {
        resolve(null);
      });
    });
  }

  async disconnect() {
    return this.client.end();
  }

  async drop() {
    await new Promise(resolve => this.client.flushdb(resolve));
  }
}
