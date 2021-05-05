import { EntityManager } from 'typeorm';
import { SendMailOptions } from 'nodemailer';
import dbless from 'dbless-email-verification';
import { Environment, IUser, JobType } from '@core/interfaces';
import { prettifyMoney, dateOrdinal } from '@core/helpers';
import { Host, User, HostInvitation, Performance, Ticket, PasswordReset, PatronTier, Invoice } from '@core/api';

import Env from '../env';
import Queue from './queue';
import moment from 'moment';

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
  const performanceLink = `${Env.FE_URL}/performances/${performance._id}/watch`;

  return sendEmail({
    from: Env.EMAIL_ADDRESS,
    to: purchaser.email_address,
    subject: `Receipt of purchase of StageUp ticket 🎭`,
    html: `
    <p>
      You purchased a <b>${ticket.name}</b> ticket to watch <b>${performance.name}</b> for <b>${prettifyMoney(
      ticket.amount,
      ticket.currency
    )}</b>.<br/>
      <br/><a href="${performanceLink}">Click here to watch</a>
      <br/>
      <br/>Reciept of this purchase: <a href="${receiptUrl}">${receiptUrl}</a>
      <br/>
      <br/>Thanks,<br/>StageUp Team
    </p>`
  });
};

export const sendUserPatronSubscriptionConfirmation = async (user: User, tier: PatronTier) => {
  return sendEmail({
    from: Env.EMAIL_ADDRESS,
    to: user.email_address,
    subject: `Patron Subscription to ${tier.name}`,
    html: `
      <p>
        Hey there, <br/>
        Thank you for supporting <b>@${tier.host.username}</b><br/>
        <br/>
        Your patron payments of <b>${prettifyMoney(tier.amount, tier.currency)}</b> will be debited on
        ${dateOrdinal(new Date(), true)} of each month, starting today.<br/>
        <br/>
        You can cancel your payment at any time.<br/>
        By making this payment, you agree to <a href="${Env.FE_URL}/terms-of-service">StageUp's Terms of Use.</a>.
        <br/>
        <br/>Thanks,<br/>StageUp Team
      </p>
    `
  });
};

export const sendHostPatronTierPurchaseConfirmation = async (subscriber: User, tier: PatronTier) => {
  return sendEmail({
    from: Env.EMAIL_ADDRESS,
    to: tier.host.email_address,
    subject: `New Patron to ${tier.name}`,
    html: `
      <p>
        Hey there, <br/>
        @${subscriber.username} is now a patron of your company.<br/>
        <br/>
        Patron Tier: <b>${tier.name}</b><br/>
        Amount: <b>${prettifyMoney(tier.amount, tier.currency)}</b>
        <br/>
        <br/>Thanks,<br/>StageUp Team
      </p>
    `
  });
};

export const sendEmailToResetPassword = async (
  user: User,
  userEmailAddress: PasswordReset['email_address'],
  otp: PasswordReset['otp']
) => {
  const resetPasswordLink = `http://localhost:4200/users/reset-password?otp=${otp}`;

  return sendEmail({
    from: Env.EMAIL_ADDRESS,
    to: userEmailAddress,
    subject: 'StageUp Reset Password',
    html: `<p>
        Hello <b>${user.username}</b>, <br><br>
        You are receiving this because you (or someone else) have requested the reset of the password for your StageUp account.<br><br>
        Please click on the following link to complete the process. This link is valid for the next 24 hours.<br>
        <div>
            <a href="${resetPasswordLink}"target="_blank" rel="noopener" style="background-color:#e0158b;border-radius:3px;color:#ffffff;display:inline-block;font-family:sans-serif;font-size:13px;font-weight:bold;line-height:38px;text-align:center;text-decoration:none;width:200px;-webkit-text-size-adjust:none;">Reset Password</a>
        </div><br>
        If you did not request this change, please ignore this email and your password will remain unchanged.<br><br>
        Thank you, <br>
        The StageUp Team.
        </p>`
  });
};

export const sendEmailToConfirmPasswordReset = async (user: User) => {
  return sendEmail({
    from: Env.EMAIL_ADDRESS,
    to: user.email_address,
    subject: 'Your StageUp password was just changed',
    html: `<p>
      Your StageUp account password has recently been changed.<br/><br/>
      If you did not make this change, please login into your account and change your password as soon as possible.<br>
      If you have recently changed your password, then please ignore this email.<br><br>
      Thank you.<br>
      The StageUp Team.
      </p>`
  });
};

export const sendInvoiceRefundRequestConfirmation = async (invoice: Invoice) => {
  return sendEmail({
    from: Env.EMAIL_ADDRESS,
    to: invoice.user.email_address,
    subject: `StageUp: Your refund request has been sent to ${invoice.host.name}`,
    html: `
    <h3>Hi ${invoice.user.name},</h3>
    <p>Your refund request for the following invoice has been sent to <strong>${invoice.host.name}</strong>.
    
    <ul style="list-style-type:none">
      <li><strong>Invoice#: </strong>${ invoice._id}</li>
      <li><strong>Performance: </strong>${ invoice.ticket.performance.name}</li>
      <li><strong>Purchased on: </strong>${ moment.unix(invoice.purchased_at).format("LLLL") }</li>
      <li><strong>Amount: </strong>${ prettifyMoney(invoice.amount, invoice.currency) }</li>
    </ul>
    <p>We'll let you know when the host has processed your request</p>
    <p>Kind regards,</p>
    <p>StageUp Team</p>`
  });
};

