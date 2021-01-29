import { EOL } from 'os';
import { Direction, Flags, Format, TypeormUml } from 'typeorm-uml';
import config, { Environment } from '../../config';
import log from '../logger';
import * as TORM from 'typeorm';

import { User } from '../../models/users/user.model';
import { OnboardingStepReview } from '../../models/hosts/onboarding-step-review.model';
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
      entities: [
        User,
        Onboarding,
        Host,
        OnboardingStepReview,
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
      synchronize: !config.isEnv(Environment.Production),
      logging: false
    });

    // await generateUML(conn);

    return conn;
  } catch (error: unknown) {
    log.error('Unable to connect to Postgres via TypeORM. Ensure a valid connection', error);
    throw error;
  }
};

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
