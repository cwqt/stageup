import { JobsOptions } from 'bullmq';
import { Attachment } from 'nodemailer/lib/mailer';
import { IInvoice } from '../finance/invoice.interface';
import { IHost, IHostPrivate } from '../hosts/host.interface';
import { ILocale } from '../i18n/i18n.interface';
import { IPerformance } from '../performances/performance.interface';

export const JobTypes = [
  'send_email',
  'schedule_performance_release',
  'host_invoice_csv',
  'host_invoice_pdf',
  'collect_performance_analytics',
  'collect_host_analytics'
] as const;

export type JobType = typeof JobTypes[number];

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
  ['schedule_performance_release']: Required<Pick<IPerformance, '_id'>>;
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
