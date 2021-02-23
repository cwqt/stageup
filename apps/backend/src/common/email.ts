import { SendMailOptions } from 'nodemailer';
import dbless from 'dbless-email-verification';
import Env from '../env';
import { Host } from '../models/hosts/host.model';
import { Environment, JobType } from '@core/interfaces';
import { User } from '../models/users/user.model';
import { HostInvitation } from '../models/hosts/host-invitation.model';
import { EntityManager } from 'typeorm';
import { log } from './logger';
import Queue from './queue';

const generateEmailHash = (email: string): string => {
  return dbless.generateVerificationHash(email, Env.PRIVATE_KEY, 60);
};

export const verifyEmail = (email: string, hash: string): boolean => {
  if (!Env.isEnv(Environment.Production)) return true;
  return dbless.verifyHash(hash, email, Env.PRIVATE_KEY);
};

// Return bool for success instead of try/catching for brevity
export const sendEmail = (mailOptions: SendMailOptions) => {
  // Don't send mail when in dev/test, unless explicitly set in .env
  if (Env.isEnv([Environment.Production, Environment.Staging]) == false) {
    if (Env.EMAIL_IN_DEVELOPMENT == false) {
      log.warn(`Did not send e-mail because it is disabled in development`);
      return;
    }
  }

  Queue.enqueue({
    type: JobType.SendEmail,
    data: mailOptions,
  })
}


export const sendVerificationEmail = async (email_address: string) => {
  const hash = generateEmailHash(email_address);
  const verificationUrl = `${Env.API_URL}/auth/verify?email=${email_address}&hash=${hash}`;

  return sendEmail({
    from: Env.EMAIL_ADDRESS,
    to: email_address,
    subject: `Verify your ${Env.SITE_TITLE} account.`,
    html: `<p>Click the link to verify: <a href="${verificationUrl}">${verificationUrl}</a></p>`
  });
};

export const sendUserHostMembershipInvitation = async (
  inviter: User,
  invitee: User,
  host: Host,
  txc: EntityManager
) => {
  const invite = new HostInvitation(inviter, invitee, host);
  await txc.save(invite);

  // Re-direct to frontend which will then send a request to backend host landing page
  const acceptanceUrl = `${Env.API_URL}/hosts/${host._id}/invites/${invite._id}`;

  return sendEmail({
    from: Env.EMAIL_ADDRESS,
    to: invitee.email_address,
    subject: `You have been invited to join '${host.username}' by ${inviter.name || inviter.username}`,
    html: `<p>Click the link to accept the inviation: <a href="${acceptanceUrl}">${acceptanceUrl}</a>, this invite will expire in 24 hours.</p>`
  });
};
