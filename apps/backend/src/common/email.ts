import { EntityManager } from 'typeorm';
import { SendMailOptions } from 'nodemailer';
import dbless from 'dbless-email-verification';
import { Environment, JobType } from '@core/interfaces';
import { prettifyMoney } from '@core/shared/helpers';
import { Host, User, HostInvitation, Performance, Ticket } from '@core/shared/api';

import Env from '../env';
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
  Queue.enqueue({
    type: JobType.SendEmail,
    data: mailOptions
  });
};

export const sendVerificationEmail = async (email_address: string) => {
  const hash = generateEmailHash(email_address);
  const verificationUrl = `${Env.API_URL}/auth/verify-email?email=${email_address}&hash=${hash}`;

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

export const sendPerformanceAccessTokenProvisioned = async (
  email_address: User['email_address'],
  performance: Performance,
  host: Host
) => {
  const performanceLink = `${Env.FE_URL}/performances/${performance._id}/watch`;

  return sendEmail({
    from: Env.EMAIL_ADDRESS,
    to: email_address,
    subject: `You have been invited to watch a private performance`,
    html: `<p>Click the link to watch ${performance.name} by ${host.name} on StageUp now: <a href="${performanceLink}">${performanceLink}</a></p>`
  });
};

export const sendTicketPurchaseConfirmation = async (
  purchaser: User,
  ticket: Ticket,
  performance: Performance,
  receiptUrl: string
) => {
  return sendEmail({
    from: Env.EMAIL_ADDRESS,
    to: purchaser.email_address,
    subject: `Receipt of purchase of StageUp ticket 🎭`,
    html: `
    <p>
      You bought <b>${ticket.name}</b> for <b>${prettifyMoney(ticket.amount, ticket.currency)}</b> to watch <b>${performance.name}</b>.
      <br/><a href="${receiptUrl}">${receiptUrl}</a>  
    </p>`
  });
};