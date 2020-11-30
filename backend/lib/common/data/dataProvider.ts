import { RedisClient } from "redis";
import connectRedis from "connect-redis";
import * as Influx from "influx";
import * as TORM from 'typeorm';
import log from '../logger';

import PostgresProvider from "./postgresProvider";
import RedisProvider from "./redisProvider";
import InfluxProvider from "./influxProvider";

export interface DataClient {
  redis: null | RedisClient;
  influx: null | Influx.InfluxDB;
  torm: null | TORM.Connection;
  session_store: null | connectRedis.RedisStore;
}

const timeout = async <T>(f:() => Promise<T>, maxExecutionTime:number):Promise<T> => {
  return new Promise((resolve, reject) => {
    f().then(v => resolve(v));
    setTimeout(reject, maxExecutionTime);
  });
}

export const create = async (): Promise<DataClient> => {
  const dataClient: DataClient = {
    torm: await timeout(PostgresProvider.create, 2000),
    redis: await timeout(RedisProvider.create, 2000),
    influx: await timeout(InfluxProvider.create, 2000),
    session_store: null,
  };


  // Once redis is connected, set up the session store
  dataClient.session_store = await RedisProvider.store(dataClient.redis);
  log.info('--- ALL DATABASES CONNECTED ---');
  return dataClient;
};

export const close = async (client: DataClient) => {
  await Promise.all([
    //Influx has no close command
    client.redis.quit(),
    client.torm.close(),
  ]);
};

export default { create, close };
