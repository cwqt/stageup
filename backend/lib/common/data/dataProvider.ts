import { RedisClient } from "redis";
import connectRedis from "connect-redis";
import * as Influx from "influx";
import * as TORM from 'typeorm';
import Mux from '@mux/mux-node';
import localtunnel from "localtunnel";
import log from '../logger';

import PostgresProvider from "./postgres.provider";
import RedisProvider from "./redis.provider";
import MUXProvider from './mux.provider';
import tunnelProvider from './localtunnel.provider';
// import InfluxProvider from "./influx.provider";
// import s3Provider from './awsS3.provider';

export interface DataClient {
  redis: null | RedisClient;
  influx: null | Influx.InfluxDB;
  torm: null | TORM.Connection;
  // tunnel : null | localtunnel.Tunnel;
  session_store: null | connectRedis.RedisStore;
  mux: Mux;
}

const timeout = async <T>(f:() => Promise<T>, maxExecutionTime:number):Promise<T> => {
  return new Promise((resolve, reject) => {
    let t = setTimeout(() => {
      log.error(`Took took long to connect to service.`)
      process.exit();
    }, maxExecutionTime);
    f().then(v => {
      clearTimeout(t);
      resolve(v);
    });
  });
}

export const create = async (): Promise<DataClient> => {
  const dataClient: DataClient = {
    // tunnel: await timeout(tunnelProvider.create, 5000),
    torm: await timeout(PostgresProvider.create, 10000),
    redis: await timeout(RedisProvider.create, 5000),
    mux: null,  // await timeout(MUXProvider.create, 5000),
    influx: null, //await timeout(InfluxProvider.create, 2000),
    session_store: null,
  };

  // Once (if assuming set to not use MemoryStore) - Redis is connected, set up the session store
  if(dataClient.redis) dataClient.session_store = await timeout(RedisProvider.store(dataClient.redis), 2000);
  return dataClient;
};

export const close = async (client: DataClient) => {
  await Promise.all([
    //Influx has no close command
    // tunnelProvider.close(client.tunnel),
    client.redis.quit(),
    client.torm.close(),
  ]);
};

export default { create, close };
