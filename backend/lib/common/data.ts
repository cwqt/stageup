import redis from "redis";
import log from "./logger";
import session from "express-session";
import config from "../config";
import { ErrorHandler } from "./errors";
import { HTTP } from "./http";
import * as Influx from "influx";
import { Client as pgClient } from 'pg';

const pg = new pgClient();
pg.connect();

const redisClient = redis.createClient();
const redisStore = require("connect-redis")(session);
const Redis = new redisStore({
  client: redisClient,
  host: config.PRODUCTION ? "" : "localhost",
  port: 6379,
  ttl: 86400,
});

const influx = new Influx.InfluxDB({
  host: "localhost",
  database: "metrics",
});

let dbs = {
  pg: false,
  redis: false,
  influx: false,
};

export const connectAllDatabases = async (itrlimit: number = 10, delay: number = 1000) => {
  let itrs: number = 0;

  while (Object.values(dbs).every((val) => val === false)) {
    log.info(`Attempting to connect...${itrs}/${itrlimit}:\n${JSON.stringify(dbs)}`);

    if (!dbs.redis) redisClient.on("connect", () => (dbs.redis = true));
    if (!dbs.influx) dbs.influx = true;
    if (!dbs.pg) pg.query('SELECT NOW()').then(() => dbs.pg = true);

    itrs++;
    if (itrs == itrlimit) throw new Error("Exceeded iterations for DB connections");
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
};

// export const sessionable = async <T>(
//   f: (t: Transaction) => Promise<T>,
//   txc?: Transaction
// ): Promise<T> => {
//   if (!txc) {
//     const session = n4j.session();
//     try {
//       const txc = session.beginTransaction();
//       const res = await f(txc);
//       await txc.commit();
//       return res;
//     } catch (error) {
//       throw new Error(error);
//     } finally {
//       await session.close();
//     }
//   } else {
//     f(txc);
//   }
// };

export default {
  redis: Redis,
  redisClient: redisClient,
  influx: influx,
  postgres: postgres
};
