import { JobType } from '@core/interfaces';
import Env from 'apps/runner/src/env';
import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import { log } from '../../logger';

export default () => {
  return new Worker(JobType.SendEmail, async job => {
    await new Promise((resolve, reject) => {
      const options: nodemailer.SendMailOptions = job.data;

      const transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: Env.SENDGRID.username,
          pass: Env.SENDGRID.api_key
        }
      });

      transporter.sendMail(options, (error: Error) => {
        if (error) {
          log.error('Error sending e-mail', error);
          return reject(error);
        }

        return resolve(true);
      });
    });
  });
};
