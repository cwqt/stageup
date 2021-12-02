import { JobsOptions } from 'bullmq';
import { Attachment } from 'nodemailer/lib/mailer';

import { IAsset, IHost, IHostPrivate, IInvoice, ILocale, IPerformance, IUserMarketingInfo } from '@core/interfaces';

export const JobTypes = [
  'send_email',
  'send_reminder_emails',
  'host_invoice_csv',
  'host_invoice_pdf',
  'host_audience_csv',
  'collect_performance_analytics',
  'collect_host_analytics',
  'ping_sse'
] as const;

export type JobType = typeof JobTypes[number];

export const EmailReminderTypes = ['24_HOURS', '15_MINUTES'] as const;
export type EmailReminderType = typeof EmailReminderTypes[number];

export type JobData = {
  ['ping_sse']: {
    asset_id: IAsset['_id'];
  };
  ['collect_performance_analytics']: {
    performance_id: IPerformance['_id'];
  };
  ['collect_host_analytics']: {
    host_id: IHost['_id'];
  };
  ['send_email']: {
    from: string;
    to: string;
    subject: string;
    content: string;
    markdown?: boolean;
    attachments: Attachment[];
  };
  ['send_reminder_emails']: {
    performance_id: IPerformance['_id'];
    sender_email_address: string;
    type: EmailReminderType;
    premier_date: number;
    url: string;
  };
  ['host_invoice_csv']: {
    locale: ILocale;
    sender_email_address: string;
    email_address: IHostPrivate['email_address'];
    invoice_ids: Array<IInvoice['_id']>;
  };
  ['host_invoice_pdf']: {
    locale: ILocale;
    sender_email_address: string;
    email_address: IHostPrivate['email_address'];
    invoice_ids: Array<IInvoice['_id']>;
  };
  ['host_audience_csv']: {
    locale: ILocale;
    sender_email_address: string;
    receiver_email_address: IHostPrivate['email_address'];
    host_id: IHostPrivate['_id'];
    audience_ids: Array<IUserMarketingInfo['_id']>;
  };
};

export type IJob<T extends JobType> = JobData[T] & { options?: JobsOptions };
