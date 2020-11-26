import Knex from "knex";
import config from "../../config";
import log from "../logger";

export const create = async () => {
  log.info(`Connecting to PostgreSQL (knex)...`);
  
  const knex = Knex({
    client: "pg",
    connection: {
      user: config.PG.USER,
      password: config.PG.PASS,
      host: config.PG.HOST,
      port: config.PG.PORT,
      database: config.PG.DB,
    },
    pool: {
      min: 0,
      max: 7,
      idleTimeoutMillis: 100,
    },
    acquireConnectionTimeout: 2000,
  });

  // Verify the connection before proceeding
  try {
    await knex.raw("SELECT now()");
    return knex;
  } catch (error) {
      console.log(error)
      log.error("Unable to connect to Postgres via Knex. Ensure a valid connection.")
      throw error;
  }
};

export default { create };
