import Env from '@backend/env';
import { PG_MODELS, ProviderMap, Providers } from '@core/api';
import { Environment } from '@core/interfaces';
import { Configuration } from '../../../backend/src/common/configuration.entity';
import { log } from '../../../backend/src/common/logger';
import * as express from 'express';

export declare type Request = express.Request;
export interface ServiceProviderMap extends ProviderMap {
  orm: InstanceType<typeof Providers.Postgres>;
  stripe: InstanceType<typeof Providers.Stripe>;
  bus: InstanceType<typeof Providers.EventBus>;
}

export class BaseService {
  protected serviceProviderMap: ServiceProviderMap;

  constructor(protected req?: Request) {
    this.serviceProviderMap = {
      orm: new Providers.Postgres(
        {
          host: Env.PG.HOST,
          port: Env.PG.PORT,
          username: Env.PG.USERNAME,
          password: Env.PG.PASSWORD,
          database: Env.PG.DATABASE,
          // Re-sync in test, dev & staging - prod use migrations
          synchronize: !Env.isEnv(Environment.Production)
        },
        { ...PG_MODELS, Configuration }
      ),
      stripe: new Providers.Stripe({
        public_key: Env.STRIPE.PUBLIC_KEY,
        private_key: Env.STRIPE.PRIVATE_KEY,
        webhook_signature: Env.STRIPE.WEBHOOK_SIGNATURE,
        client_id: Env.STRIPE.CLIENT_ID
      }),
      bus: new Providers.EventBus({}, log)
    };
  }
}
