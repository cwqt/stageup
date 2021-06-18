import { IPerformance } from '../performances/performance.interface';
import { Job, JobsOptions } from 'bullmq';
import { IInvoice } from '../common/invoice.interface';
import { IHostPrivate } from '../hosts/host.interface';
import { SendMailOptions } from 'nodemailer';
import { Attachment } from 'nodemailer/lib/mailer';
import { ILocale } from '../i18n/i18n.interface';

export const JobTypes = ['send_email', 'schedule_performance_release', 'host_invoice_csv', 'host_invoice_pdf'] as const;

export type JobType = typeof JobTypes[number];

export type JobData = {
  ['send_email']: {
    from: string;
    to: string;
    subject: string;
    content: string;
    markdown: boolean;
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