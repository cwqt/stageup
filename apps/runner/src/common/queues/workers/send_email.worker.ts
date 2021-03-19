import { Environment, JobType } from '@core/interfaces';
import { RunnerProviderMap } from 'apps/runner/src';
import Env from 'apps/runner/src/env';
import { Worker } from 'bullmq';
import { SendMailOptions } from 'nodemailer';
import { log } from '../../logger';

export default (pm: RunnerProviderMap) => {
  return new Worker(
    JobType.SendEmail,
    async job => {
      await new Promise((resolve, reject) => {
        // Don't send mail when in dev/test, unless explicitly set in .env
        if (Env.isEnv([Environment.Production, Environment.Staging]) == false) {
          if (pm.sendgrid.config.enabled == false) {
            log.warn(`Did not send e-mail because it is disabled from .env`);
            return resolve(true);
          }
        }

        const options: SendMailOptions = job.data;
        pm.sendgrid.connection.sendMail(options, (error: Error) => {
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
        host: Env.REDIS.host,
        port: Env.REDIS.port
      }
    }
  );
};
