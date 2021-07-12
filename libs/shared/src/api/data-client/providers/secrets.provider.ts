import { RedisClient, createClient } from 'redis';
import { Provider } from '../';

export interface ISecretsProviderConfig {}

export default class SecretsProvider implements Provider<SecretsProvider> {
  name = 'Secrets';
  connection: null;
  config: ISecretsProviderConfig;

  constructor(config: ISecretsProviderConfig) {
    this.config = config;
  }

  async connect() {
    return null;
  }

  async disconnect() {}

  async drop() {}
}
