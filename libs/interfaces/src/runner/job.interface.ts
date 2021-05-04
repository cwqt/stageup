import { IPerformance } from '../performances/performance.interface';
import { Job, JobsOptions } from 'bullmq';
import { IInvoice } from '../common/invoice.interface';
import { IHostPrivate } from '../hosts/host.interface';
import { SendMailOptions } from 'nodemailer';

export enum JobType {
  SendEmail = 'send_email',
  ScheduleRelease = 'schedule_release',
  HostInvoiceCSV = 'host_invoice_csv',
  HostInvoicePDF = 'host_invoice_pdf'
}

export type JobUnion =
  | {
      type: JobType.SendEmail;
      data: SendMailOptions;
    }
  | {
      type: JobType.ScheduleRelease;
      data: IScheduleReleaseJobData;
    }
  | {
      type: JobType.HostInvoiceCSV;
      data: IHostInvoiceCSVJobData;
    }
  | {
      type: JobType.HostInvoicePDF;
      data: IHostInvoicePDFJobData;
    };
export type IJob = JobUnion & { options?: JobsOptions };

export type IScheduleReleaseJobData = Required<Pick<IPerformance, '_id'>>;
export type IHostInvoiceCSVJobData = { email_address: IHostPrivate['email_address']; invoices: Array<IInvoice['_id']> };
export type IHostInvoicePDFJobData = { email_address: IHostPrivate['email_address']; invoices: Array<IInvoice['_id']> };
