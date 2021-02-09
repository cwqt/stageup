import Env from '../../env';
import log from '../logger';
import * as TORM from 'typeorm';
import { Environment } from '@core/interfaces';

import { User } from '../../models/users/user.model';
import { OnboardingReview } from '../../models/hosts/onboarding-review.model';
import { Onboarding } from '../../models/hosts/onboarding.model';
import { Host } from '../../models/hosts/host.model';
import { UserHostInfo } from '../../models/hosts/user-host-info.model';
import { PerformanceHostInfo } from '../../models/performances/performance-host-info.model';
import { Performance } from '../../models/performances/performance.model';
import { SigningKey } from '../../models/performances/signing-key.model';
import { Address } from '../../models/users/address.model';
import { ContactInfo } from '../../models/users/contact-info.model';
import { Person } from '../../models/users/person.model';
import { Asset } from '../../models/asset.model';
import { PerformancePurchase } from '../../models/performances/purchase.model';

export const create = async (): Promise<TORM.Connection> => {
  log.info('Connecting to PostgreSQL (TypeORM)...');

  if (typeof Env.PG.HOST === 'undefined') {
    throw new TypeError('Missing .env POSTGRES_HOST');
  }

  if (typeof Env.PG.PORT === 'undefined') {
    throw new TypeError('Missing .env POSTGRES_PORT');
  }

  if (typeof Env.PG.USER === 'undefined') {
    throw new TypeError('Missing .env POSTGRES_USER');
  }

  if (typeof Env.PG.PASS === 'undefined') {
    throw new TypeError('Missing .env POSTGRES_PASS');
  }

  if (typeof Env.PG.DB === 'undefined') {
    throw new TypeError('Missing .env POSTGRES_DB');
  }

  try {
    const conn = await TORM.createConnection({
      type: 'postgres',
      host: Env.PG.HOST,
      port: Env.PG.PORT,
      username: Env.PG.USER,
      password: Env.PG.PASS,
      database: Env.PG.DB,
      entities: [
        User,
        Onboarding,
        Host,
        OnboardingReview,
        UserHostInfo,
        PerformanceHostInfo,
        Performance,
        SigningKey,
        Address,
        ContactInfo,
        Person,
        Asset,
        PerformancePurchase
      ],
      synchronize: !Env.isEnv(Environment.Production),
      logging: false
    });

    // await generateUML(conn);

    return conn;
  } catch (error: unknown) {
    log.error('Unable to connect to Postgres via TypeORM. Ensure a valid connection', error);
    throw error;
  }
};

// const generateUML = async (conn: TORM.Connection) => {
// if(config.isEnv(Environment.Development)) {
//     import { EOL } from 'os';
//     import { Direction, Flags, Format, TypeormUml } from 'typeorm-uml';

//     const flags: Flags = {
//       direction: Direction.LR,
//       format: Format.SVG,
//       handwritten: false
//     };
  
//     const typeormUml = new TypeormUml();
//     const url = await typeormUml.build(conn, flags);
//     process.stdout.write('Diagram URL: ' + url + EOL);
//   }
// }

export default { create };
