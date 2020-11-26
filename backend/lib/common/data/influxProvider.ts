import config from "../../config";
import * as Influx from "influx";
import log from "../logger";

export const create = async () => {
  log.info(`Connecting to Influx...`);
  if (!config.REDIS.HOST) throw new Error("No Redis url found.");

  const influxClient = new Influx.InfluxDB({
    host: config.INFLUX.HOST,
    database: config.INFLUX.DB,
  });

  return new Promise<Influx.InfluxDB>(async (resolve, reject) => {
    const pong: Influx.IPingStats[] = await influxClient.ping(2e3);
    if (pong.length) {
      resolve(influxClient);
    } else {
      reject();
    }
  });
};

export default { create };
