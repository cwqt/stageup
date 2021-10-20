import { createClient, RedisClient } from 'redis';
import { Service, Token } from 'typedi';
import { Provider } from '../';

export interface IRedisProviderConfig {
  host: string;
  port: number;
}

export interface CacheFunctions {
  getFromCache: (cacheId: string) => Promise<any>;
  setInCache: (id: string) => Promise<void>;
}

@Service()
export class RedisProvider implements Provider<RedisClient> {
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
      this.connection.on('connect', () => resolve(this.connection));
      this.connection.on('error', reject);
    });
  }

  public async getFromCache(cacheId: string) {
    try {
      this.connection.get(cacheId, async (error, data) => {
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
      this.connection.setex(cacheId, expiration, JSON.stringify(data));
    } catch (error) {
      console.log(error);
    }
  }

  // // TODO: Set databaseMethod to function type
  // // Checks the cache for data stored with the cacheId. If not, it uses the serviceMethod to get the data and store it.
  // public async getFromCache(cacheId: string, serviceMethod: any, expiration?: number): Promise<any> {
  //   try {
  //     this.connection.get(cacheId, async (error, data) => {
  //       if (error) throw error;
  //       if (data) {
  //         return data;
  //       } else {
  //         const data = await serviceMethod();
  //         this.connection.setex(cacheId, expiration, JSON.stringify(data));
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
    return this.connection.end();
  }

  async drop() {
    await new Promise(resolve => this.connection.flushdb(resolve));
  }
}
