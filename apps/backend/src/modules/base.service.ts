import Env from '@backend/env';
import { PG_MODELS, ProviderMap, Providers } from '@core/api';
import { Environment } from '@core/interfaces';
import { Configuration } from '../../../backend/src/common/configuration.entity';
import { log } from '../../../backend/src/common/logger';
import * as express from 'express';
import { Connection } from 'typeorm';

export declare type Request = express.Request;
export interface ServiceProviderMap extends ProviderMap {
  orm: InstanceType<typeof Providers.Postgres>;
  stripe: InstanceType<typeof Providers.Stripe>;
  bus: InstanceType<typeof Providers.EventBus>;
}

export class BaseService<T extends ProviderMap> {
  providers: T;

  get ORM(): Connection {
    return this.providers['torm'].connection;
  }

  constructor(pm: T, protected req?: Request) {
    this.providers = pm;
  }
}
