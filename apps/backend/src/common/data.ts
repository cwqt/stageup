import Mux from '@mux/mux-node';
import { ProviderMap, Providers } from '@core/shared/api';

import { RedisClient } from 'redis';
import { Connection } from 'typeorm';
import { Tunnel } from 'localtunnel';
import { RedisStore } from 'connect-redis';
import { MemoryStore } from 'express-session';
import { InfluxDB } from 'influx';
import { S3 } from 'aws-sdk';
import Env from '../env';

import {
  User,
  AccessToken,
  HostInvitation,
  Invoice,
  Ticket,
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
  s3: S3;
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
    Invoice,
    Ticket,
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
    }),
    s3: new Providers.S3({
      s3_access_key_id: Env.AWS.S3_ACCESS_KEY_ID,
      s3_access_secret_key: Env.AWS.S3_ACCESS_SECRET_KEY,
      s3_bucket_name: Env.AWS.S3_BUCKET_NAME,
      s3_url: Env.AWS.S3_URL,
      s3_region: Env.AWS.S3_REGION
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
