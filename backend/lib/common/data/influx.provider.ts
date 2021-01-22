import config from '../../config';
import * as Influx from 'influx';
import log from '../logger';

export const create = async () => {
  log.info(`Connecting to Influx...`);
  if (typeof config.INFLUX.HOST == 'undefined') throw new Error('');
  if (typeof config.INFLUX.DB   == 'undefined') throw new Error('');

  const influxClient = new Influx.InfluxDB({
    host: config.INFLUX.HOST,
    database: config.INFLUX.DB
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
