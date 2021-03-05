import Mux from '@mux/mux-node';
import { ProviderMap, Providers } from '@core/shared/api';

import { RedisClient } from 'redis';
import { Connection } from 'typeorm';
import { Tunnel } from 'localtunnel';
import { RedisStore } from 'connect-redis';
import { MemoryStore } from 'express-session';
import { InfluxDB } from 'influx';
import Env from '../env';

import {
  User,
  AccessToken,
  HostInvitation,
  PerformancePurchase,
  Asset,
  Person,
  ContactInfo,
  OnboardingReview,
  Address,
  Onboarding,
  SigningKey,
  PerformanceHostInfo,
  Host,
  Performance,
  UserHostInfo
} from '@core/shared/api'

import { Environment } from '@core/interfaces';

export interface BackendDataClient {
  mux: Mux;
  redis: RedisClient;
  torm: Connection;
  store: RedisStore | MemoryStore;
  tunnel?: Tunnel;
  // influx: InfluxDB;
}

export const create = (): ProviderMap<BackendDataClient> => {
  const models = [
    User,
    Onboarding,
    Host,
    OnboardingReview,
    UserHostInfo,
    PerformanceHostInfo,
    Performance,
    SigningKey,
    Address,
    ContactInfo,
    Person,
    Asset,
    PerformancePurchase,
    HostInvitation,
    AccessToken
  ];

  const map:ProviderMap<BackendDataClient> = {
    mux: new Providers.Mux({
      access_token: Env.MUX.ACCESS_TOKEN,
      secret_key: Env.MUX.SECRET_KEY,
      image_api_endpoint: Env.MUX.IMAGE_API_ENDPOINT,
      hook_signature: Env.MUX.HOOK_SIGNATURE
    }),
    torm: new Providers.Postgres(
      {
        host: Env.PG.HOST,
        port: Env.PG.PORT,
        username: Env.PG.USERNAME,
        password: Env.PG.PASSWORD,
        database: Env.PG.DATABASE,
        synchronize: true//Env.isEnv([Environment.Development, Environment.Testing])
      },
      models
    ),
    redis: new Providers.Redis({
      host: Env.REDIS.HOST,
      port: Env.REDIS.PORT
    }),
    store: new Providers.Store({
      host: Env.STORE.HOST,
      port: Env.STORE.PORT,
      ttl: Env.STORE.TTL,
      use_memorystore: Env.STORE.USE_MEMORYSTORE
    })
  };

  // Use HTTP tunnelling in development for receiving hooks
  if(!Env.isEnv([Environment.Production, Environment.Staging])) {
    map.tunnel = new Providers.LocalTunnel({
      port: Env.LOCALTUNNEL.PORT,
      domain: Env.LOCALTUNNEL.DOMAIN
    })
  }

  return map;
};

export default { create };
