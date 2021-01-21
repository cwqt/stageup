import config from '../../config';
import log from '../logger';
import 'reflect-metadata';
import * as TORM from 'typeorm';

export const create = async (): Promise<TORM.Connection> => {
  log.info(`Connecting to PostgreSQL (TypeORM)...`);

  try {
    let conn = await TORM.createConnection({
      type: 'postgres',
      host: config.PG.HOST,
      port: config.PG.PORT,
      username: config.PG.USER,
      password: config.PG.PASS,
      database: config.PG.DB,
      entities: [__dirname + '/../../**/*.model.{js,ts}'],
      synchronize: config.PRODUCTION ? false : true,
      logging: false,
    });

    //await generateUML(conn);

    return conn;
  } catch (error) {
    log.error('Unable to connect to Postgres via TypeORM. Ensure a valid connection.');
    throw error;
  }
};

import { EOL } from 'os';
import { Direction, Flags, Format, TypeormUml } from 'typeorm-uml';
const generateUML = async (conn: TORM.Connection) => {
  const flags: Flags = {
    direction: Direction.LR,
    format: Format.PNG,
    handwritten: false,
  };

  const typeormUml = new TypeormUml();
  const url = await typeormUml.build(conn, flags);
  process.stdout.write('Diagram URL: ' + url + EOL);
};

export default { create };
