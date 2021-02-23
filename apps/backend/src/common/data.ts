import Mux from '@mux/mux-node';
import { ProviderMap, Providers } from '@core/shared/api';

import { RedisClient } from 'redis';
import { Connection } from 'typeorm';
import { Tunnel } from 'localtunnel';
import { RedisStore } from 'connect-redis';
import { MemoryStore } from 'express-session';
import { InfluxDB } from 'influx';
import Env from '../env';

import { User } from '../models/users/user.model';
import { OnboardingReview } from '../models/hosts/onboarding-review.model';
import { Onboarding } from '../models/hosts/onboarding.model';
import { Host } from '../models/hosts/host.model';
import { UserHostInfo } from '../models/hosts/user-host-info.model';
import { PerformanceHostInfo } from '../models/performances/performance-host-info.model';
import { Performance } from '../models/performances/performance.model';
import { SigningKey } from '../models/performances/signing-key.model';
import { Address } from '../models/users/address.model';
import { ContactInfo } from '../models/users/contact-info.model';
import { Person } from '../models/users/person.model';
import { Asset } from '../models/asset.model';
import { PerformancePurchase } from '../models/performances/purchase.model';
import { HostInvitation } from '../models/hosts/host-invitation.model';

export interface BackendDataClient {
  mux: Mux;
  redis: RedisClient;
  torm: Connection;
  tunnel: Tunnel;
  store: RedisStore | MemoryStore;
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
    HostInvitation
  ];

  return {
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
        database: Env.PG.DATABASE
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
    tunnel: new Providers.LocalTunnel({
      port: Env.LOCALTUNNEL.PORT,
      domain: Env.LOCALTUNNEL.DOMAIN
    })
    // influx: new Providers.Influx({
    //   host: Env.INFLUX.HOST,
    //   database: Env.INFLUX.DB
    // })
  };
};

export default { create };
