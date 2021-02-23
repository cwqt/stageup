import Mux from '@mux/mux-node';
import { Provider } from '.';

export interface IMuxProviderConfig {
  access_token: string;
  secret_key: string;
  hook_signature: string;
  image_api_endpoint: string;
}

export default class MuxProvider implements Provider<Mux> {
  name = 'Mux';
  connection: Mux;
  config: IMuxProviderConfig;

  constructor(config: IMuxProviderConfig) {
    this.config = config;
  }

  async create() {
    this.connection = new Mux(this.config.access_token, this.config.secret_key);
    return this.connection;
  }

  async close() {
    return;
  }
}
