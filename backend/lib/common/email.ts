import config from '../config';
const dbless = require('dbless-email-verification');
import nodemailer from 'nodemailer';
import logger from './logger';
import { Host } from '../models/hosts/host.model';

const generateEmailHash = (email: string) => {
  const hash = dbless.generateVerificationHash(email, config.PRIVATE_KEY, 60);
  return hash;
};

export const verifyEmail = (email: string, hash: string) => {
  if (!config.PRODUCTION) {
    return true;
  }

  return dbless.erifyHash(hash, email, config.PRIVATE_KEY);
};

// Return bool for success instead of try/catching for brevity
export const sendEmail = async (
  mailOptions: nodemailer.SendMailOptions,
  sendWhileNotInProduction = false
): Promise<boolean> => {
  return new Promise((res, rej) => {
    // Don't send mail when in dev/test
    if (!sendWhileNotInProduction) {
      res(true);
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: config.SENDGRID.USERNAME,
        pass: config.SENDGRID.API_KEY
      }
    });

    transporter.sendMail(mailOptions, (error: Error) => {
      console.log(error);
      if (error) {
        logger.error(error);
        res(false);
      }

      res(true);
    });
  });
};

export const sendVerificationEmail = async (email_address: string): Promise<boolean> => {
  const hash = generateEmailHash(email_address);
  const verificationUrl = `${config.API_URL}/auth/verify?email=${email_address}&hash=${hash}`;

  return sendEmail({
    from: config.EMAIL_ADDRESS,
    to: email_address,
    subject: `Verify your ${config.SITE_TITLE} account.`,
    html: `<p>Click the link to verify: <a href="${verificationUrl}">${verificationUrl}</a></p>`
  });
};

export const sendUserHostMembershipInvitation = async (email_address: string, host: Host): Promise<boolean> => {
  const acceptanceUrl = '';

  return sendEmail({
    from: config.EMAIL_ADDRESS,
    to: email_address,
    subject: `You have been invited to join ${host.username}`,
    html: `<p>Click the link to accept the inviation: <a href="${acceptanceUrl}">${acceptanceUrl}</a></p>`
  });
};
