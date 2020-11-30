import config from "../../config";
import log from "../logger";
import "reflect-metadata";
import * as TORM from "typeorm";

import { User } from '../../models/User.model';

export const create = async (): Promise<TORM.Connection> => {
  log.info(`Connecting to PostgreSQL (TypeORM)...`);

  try {
    let conn = await TORM.createConnection({
      type: "postgres",
      host: config.PG.HOST,
      port: config.PG.PORT,
      username: config.PG.USER,
      password: config.PG.PASS,
      database: config.PG.DB,
      entities: [__dirname + '/../../**/*.model.{js,ts}'],
      synchronize: true,
      logging: false,
    });

    return conn;
  } catch (error) {
    log.error(
      "Unable to connect to Postgres via TypeORM. Ensure a valid connection."
    );
    throw error;
  }
};

export default { create };
