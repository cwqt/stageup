import { IHostInvoiceCSVJobData, JobType } from '@core/interfaces';
import { Invoice } from '@core/shared/api';
import { timestamp } from '@core/shared/helpers';
import { writeToBuffer } from '@fast-csv/format';
import { RunnerProviderMap } from 'apps/runner/src';
import Env from 'apps/runner/src/env';
import { Worker } from 'bullmq';
import { In } from 'typeorm';

export default (pm: RunnerProviderMap) => {
  return new Worker(
    JobType.HostInvoiceCSV,
    async job => {
      const data: IHostInvoiceCSVJobData = job.data;

      const invoices = await Invoice.find({
        where: { _id: In(data.invoices) },
        relations: { ticket: { performance: true } },
        select: {
          ticket: {
            _id: true,
            type: true,
            performance: {
              _id: true,
              name: true
            }
          }
        }
      });

      const csv = [
        ['invoice_id', 'performance_name', 'ticket_type', 'purchased_at', 'amount', 'net_amount', 'currency', 'status'],
        ...invoices.map(i => [
          i._id,
          i.ticket.performance.name,
          i.ticket.type,
          i.purchased_at,
          parseInt(i.amount as any),
          parseInt(i.amount as any), // IMPORTANT: net_amount use subscription tier from invoice
          i.currency,
          i.status
        ])
      ];

      const buffer = await writeToBuffer(csv);

      await pm.sendgrid.connection.sendMail({
        from: Env.EMAIL_ADDRESS,
        to: data.email_address,
        subject: `Exported Invoice CSV files`,
        html: `<p>See attachments for invoice data</p>`,
        attachments: [
          {
            content: buffer,
            filename: `stageup-invoice-${timestamp()}`,
            contentType: 'text/csv',
            contentDisposition: 'attachment'
          }
        ]
      });
    },
    {
      connection: {
        host: Env.REDIS.host,
        port: Env.REDIS.port
      }
    }
  );
};
