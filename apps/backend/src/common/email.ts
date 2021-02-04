import nodemailer from 'nodemailer';
import dbless from 'dbless-email-verification';
import config from '../config';
import logger from './logger';
import { Host } from '../models/hosts/host.model';
import { Environment } from '@core/interfaces';

const generateEmailHash = (email: string): string => {
  const hash = dbless.generateVerificationHash(email, config.PRIVATE_KEY, 60);
  return hash;
};

export const verifyEmail = (email: string, hash: string): boolean => {
  if (!config.isEnv(Environment.Production)) {
    return true;
  }

  return dbless.verifyHash(hash, email, config.PRIVATE_KEY);
};

// Return bool for success instead of try/catching for brevity
export const sendEmail = async (
  mailOptions: nodemailer.SendMailOptions,
  sendWhileNotInProduction = false
): Promise<boolean> => {
  return new Promise((resolve) => {
    // Don't send mail when in dev/test
    if (!sendWhileNotInProduction) return resolve(true);

    const transporter = nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: config.SENDGRID.USERNAME,
        pass: config.SENDGRID.API_KEY
      }
    });

    transporter.sendMail(mailOptions, (error: Error) => {
      if (error) {
        logger.error('Error sending e-mail', error);
        return resolve(false);
      }

      return resolve(true);
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
