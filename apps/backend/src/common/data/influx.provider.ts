import Env from '../../env';
import * as Influx from 'influx';
import log from '../logger';

export const create = async () => {
  log.info('Connecting to Influx...');
  if (typeof Env.INFLUX.HOST === 'undefined') {
    throw new TypeError('Missing .env INDFLUX_HOST');
  }

  if (typeof Env.INFLUX.DB === 'undefined') {
    throw new TypeError('Missing .env INFLUX_DB');
  }

  const influxClient = new Influx.InfluxDB({
    host: Env.INFLUX.HOST,
    database: Env.INFLUX.DB
  });

  return new Promise<Influx.InfluxDB | void>((resolve, reject) => {
    influxClient.ping(2e3).then((pong: Influx.IPingStats[]) => {
      if (pong.length > 0) {
        resolve(influxClient);
      } else {
        reject();
      }
    });
  });
};

export default { create };
