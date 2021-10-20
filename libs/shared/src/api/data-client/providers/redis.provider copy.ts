import { createClient, RedisClient } from 'redis';
import { Service, Token } from 'typedi';
import { Provider } from '../';

export interface IRedisProviderConfig {
  host: string;
  port: number;
}

export interface AppRedis {
  getFromCache: (cacheId: string) => Promise<any>;
  setInCache: (cacheId: string, data: any, expiration: number) => Promise<void>;
}

@Service()
export class RedisProvider implements Provider<AppRedis> {
  name = 'Redis';
  connection: AppRedis;
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

    return new Promise<AppRedis>((resolve, reject) => {
      this.client.on('connect', () => resolve(this.connection));
      this.client.on('error', reject);
    });
  }

  public async getFromCache(cacheId: string) {
    try {
      this.client.get(cacheId, async (error, data) => {
        if (error) throw error;
        if (data) {
          return JSON.parse(data);
        } else {
          return null;
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  public async setInCache(cacheId: string, data: any, expiration: number): Promise<void> {
    try {
      this.client.setex(cacheId, expiration, JSON.stringify(data));
    } catch (error) {
      console.log(error);
    }
  }

  // // TODO: Set databaseMethod to function type
  // // Checks the cache for data stored with the cacheId. If not, it uses the serviceMethod to get the data and store it.
  // public async getFromCache(cacheId: string, serviceMethod: any, expiration?: number): Promise<any> {
  //   try {
  //     this.client.get(cacheId, async (error, data) => {
  //       if (error) throw error;
  //       if (data) {
  //         return data;
  //       } else {
  //         const data = await serviceMethod();
  //         this.client.setex(cacheId, expiration, JSON.stringify(data));
  //         return data;
  //         // res.status(200).send({
  //         //     data: data.data,
  //         //     message: "cache miss"
  //         // });
  //       }
  //     });
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  async disconnect() {
    return this.client.end();
  }

  async drop() {
    await new Promise(resolve => this.client.flushdb(resolve));
  }
}
