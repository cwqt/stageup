import { ProviderMap, Providers } from '@core/shared/api';
import Mail from 'nodemailer/lib/mailer';

import { RedisClient } from 'redis';
import Env from '../env';

export interface RunnerDataClient {
  redis: RedisClient;
  sendgrid: Mail;
}

export const create = (): ProviderMap<RunnerDataClient> => {
  return {
    redis: new Providers.Redis({
      host: Env.REDIS.host,
      port: Env.REDIS.port
    }),
    sendgrid: new Providers.SendGrid({
      username: Env.SENDGRID.username,
      api_key: Env.SENDGRID.api_key,
      enabled: Env.SENDGRID.enabled
    })
  };
};

export default { create };
