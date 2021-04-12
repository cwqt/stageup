import { ProviderMap, Provider } from '../';
export interface ISSEProviderConfig {}

import { RedisHub } from '@toverux/expresse';

export default class SSEProvider implements Provider<RedisHub> {
  name = 'Store';
  connection: RedisHub;
  config: ISSEProviderConfig;

  constructor(config: ISSEProviderConfig) {
    this.config = config;
  }

  async connect(providerMap: ProviderMap) {
    this.connection = new RedisHub("sse");
    return this.connection;
  }

  async disconnect() {}
  async drop() {}
}
