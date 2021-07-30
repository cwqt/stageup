import { ProviderMap, Providers } from '@core/api';

export interface ServiceProviderMap extends ProviderMap {
  orm: InstanceType<typeof Providers.Postgres>;
  stripe: InstanceType<typeof Providers.Stripe>;
  bus: InstanceType<typeof Providers.EventBus>;
}

export class BaseService {
  protected serviceProviderMap: ServiceProviderMap;
}
