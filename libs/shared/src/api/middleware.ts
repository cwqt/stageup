import RateLimiter from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Request, Response } from 'express';
import apicache from 'apicache';
import { HTTP } from '@core/interfaces';
import Multer from 'multer';
import { RedisClient } from 'redis';

export interface IMiddlewareConnections {
  redis: RedisClient
}

export class Middlewares {
  connections:IMiddlewareConnections;

  constructor(connections: IMiddlewareConnections) {
    this.connections = connections;
  }

  /**
   * @description File parsing middleware
   * @param maxFileSize Max file size in kB
   * @param acceptedTypes Accepted file MIME types
   */
  file(maxFileSize: number, acceptedTypes: string[]) {
    return Multer({
      storage: Multer.memoryStorage(),
      limits: {
        fileSize: maxFileSize * 1024
      },
      fileFilter: (request: Request, file: Express.Multer.File, cb: Multer.FileFilterCallback) => {
        if (![...acceptedTypes, 'image/gif'].includes(file.mimetype)) {
          cb(new Error('File type not allowed'));
          return;
        }

        cb(null, true);
      }
    });
  }

  /**
   * @description Response caching using Redis
   * @param period Plain-english cache duration e.g. "5 minutes"
   * @param cacheFunction Cache only when true, passed req & res objects
   */
  cacher(period: string, cacheFunction?: (request: Request, res: Response) => boolean): any {
    return apicache
      .options({
        redisClient: this.connections.redis
      })
      .middleware(period, cacheFunction);
  }

  /**
   * @description Rate-limiting using Redis
   * @param period Period in seconds that requests are remembered for
   * @param max Max number of requests in period
   */
  limiter(period: number, max: number): RateLimiter.RateLimit {
    return RateLimiter({
      store: new RedisStore({
        client: this.connections.redis
      }),
      windowMs: period * 1000,
      max: max
    });
  }
}

export const cacheOnOk = (request: Request, res: Response) => res.statusCode === HTTP.OK;
export const cacheOnFail = (request: Request, res: Response) => res.statusCode === HTTP.ServerError;
