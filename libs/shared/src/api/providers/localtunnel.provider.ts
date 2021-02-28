import localtunnel, { Tunnel } from 'localtunnel';
import { Provider } from '.';

export interface ILocalTunnelProviderConfig {
  port: number;
  domain: string;
}

export default class LocalTunnelProvider implements Provider<Tunnel> {
  name = 'LocalTunnel';
  connection: Tunnel;
  config: ILocalTunnelProviderConfig;

  constructor(config: ILocalTunnelProviderConfig) {
    this.config = config;
  }

  async create() {
    this.connection = await localtunnel({
      port: this.config.port,
      subdomain: this.config.domain
    });

    return this.connection;
  }

  async close() {
    return this.connection.close();
  }
}
