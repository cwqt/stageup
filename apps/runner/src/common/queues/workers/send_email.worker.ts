import { Environment, JobType } from '@core/interfaces';
import { DataClient, ProviderMap } from '@core/shared/api';
import Env from 'apps/runner/src/env';
import { Worker } from 'bullmq';
import { SendMailOptions } from 'nodemailer';
import { RunnerDataClient } from '../../data';
import { log } from '../../logger';

export default (client: DataClient<RunnerDataClient>) => {
  return new Worker(
    JobType.SendEmail,
    async job => {
      await new Promise((resolve, reject) => {
        // Don't send mail when in dev/test, unless explicitly set in .env
        if (Env.isEnv([Environment.Production, Environment.Staging]) == false) {
          if (client.providers.sendgrid.config.enabled == false) {
            log.warn(`Did not send e-mail because it is disabled from .env`);
            return;
          }
        }

        const options: SendMailOptions = job.data;
        client.providers.sendgrid.connection.sendMail(options, (error: Error) => {
          if (error) {
            log.error('Error sending e-mail', error);
            return reject(error);
          }

          return resolve(true);
        });
      });
    },
    {
      connection: {
        host: 'redis',
        port: 6379
      }
    }
  );
};
