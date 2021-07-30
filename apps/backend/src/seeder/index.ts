import { ProviderMap, Providers } from '@core/api';
import { Seeder } from './script';

export interface SeederProviderMap extends ProviderMap {
  torm: InstanceType<typeof Providers.Postgres>;
  stripe: InstanceType<typeof Providers.Stripe>;
}

export default (providers: SeederProviderMap) => new Seeder(providers);
