import { JobsOptions } from 'bullmq';
import { Attachment } from 'nodemailer/lib/mailer';
import { IInvoice } from '../finance/invoice.interface';
import { IHost, IHostPrivate } from '../hosts/host.interface';
import { ILocale } from '../i18n/i18n.interface';
import { IPerformance } from '../performances/performance.interface';

export const JobTypes = [
  'send_email',
  'send_reminder_emails',
  'host_invoice_csv',
  'host_invoice_pdf',
  'collect_performance_analytics',
  'collect_host_analytics'
] as const;

export type JobType = typeof JobTypes[number];

export const EmailReminderTypes = ['24_HOURS', '15_MINUTES'] as const;
export type EmailReminderType = typeof EmailReminderTypes[number];

export type JobData = {
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
};

export type IJob<T extends JobType> = JobData[T] & { options?: JobsOptions };
