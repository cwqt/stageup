import localtunnel, { Tunnel } from 'localtunnel';
import { Service, Token } from 'typedi';
import { Provider } from '../index';

export interface ILocalTunnelProviderConfig {
  port: number;
  domain: string;
}

@Service()
export class LocalTunnelProvider implements Provider<Tunnel> {
  name = 'LocalTunnel';
  connection: Tunnel;
  config: ILocalTunnelProviderConfig;

  constructor(config: ILocalTunnelProviderConfig) {
    this.config = config;
  }

  async connect() {
    this.connection = await localtunnel({
      port: this.config.port,
      subdomain: this.config.domain
    });

    if (!this.connection.url.includes(this.config.domain)) console.error(`URL mismatch, ${this.connection.url}`);

    return this.connection;
  }

  async disconnect() {
    return this.connection.close();
  }
}
