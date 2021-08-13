import { InfluxDB, IPingStats } from 'influx';
import { Provider } from '../';

export interface IInfluxProviderConfig {
  host: string;
  database: string;
}

import { Service } from 'typedi';
@Service()
export default class InfluxProvider implements Provider<InfluxDB> {
  name = 'Influx';
  connection: InfluxDB;
  config: IInfluxProviderConfig;

  constructor(config: IInfluxProviderConfig) {
    this.config = config;
  }

  async connect() {
    const influx = new InfluxDB({
      host: this.config.host,
      database: this.config.database
    });

    this.connection = await new Promise<InfluxDB>((resolve, reject) => {
      influx.ping(2e3).then((pong: IPingStats[]) => {
        if (pong.length > 0) {
          resolve(influx);
        } else {
          reject('Could not connect to InfluxDB');
        }
      });
    });

    return this.connection;
  }

  async disconnect() {
    return;
  }

  async drop() {
    await this.connection.query('DROP SERIES FROM /.*/');
  }
}
