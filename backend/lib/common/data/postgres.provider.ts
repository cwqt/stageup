const path = require('path');
import config, { Environment } from '../../config';
import log from '../logger';
import * as TORM from 'typeorm';

export const create = async (): Promise<TORM.Connection> => {
  log.info('Connecting to PostgreSQL (TypeORM)...');

  if (typeof config.PG.HOST === 'undefined') {
    throw new TypeError('Missing .env PG_HOST');
  }

  if (typeof config.PG.PORT === 'undefined') {
    throw new TypeError('Missing .env PG_PORT');
  }

  if (typeof config.PG.USER === 'undefined') {
    throw new TypeError('Missing .env PG_USER');
  }

  if (typeof config.PG.PASS === 'undefined') {
    throw new TypeError('Missing .env PG_PASS');
  }

  if (typeof config.PG.DB === 'undefined') {
    throw new TypeError('Missing .env PG_DB');
  }

  try {
    const conn = await TORM.createConnection({
      type: 'postgres',
      host: config.PG.HOST,
      port: config.PG.PORT,
      username: config.PG.USER,
      password: config.PG.PASS,
      database: config.PG.DB,
      entities: [path.join(__dirname, '/../../**/*.model.{js,ts}')],
      synchronize: !config.isEnv(Environment.Production),
      logging: false
    });

    // await generateUML(conn);

    return conn;
  } catch (error) {
    log.error('Unable to connect to Postgres via TypeORM. Ensure a valid connection', error);
    throw error;
  }
};

import { EOL } from 'os';
import { Direction, Flags, Format, TypeormUml } from 'typeorm-uml';
const generateUML = async (conn: TORM.Connection) => {
  const flags: Flags = {
    direction: Direction.LR,
    format: Format.SVG,
    handwritten: false
  };

  const typeormUml = new TypeormUml();
  const url = await typeormUml.build(conn, flags);
  process.stdout.write('Diagram URL: ' + url + EOL);
};

export default { create };
