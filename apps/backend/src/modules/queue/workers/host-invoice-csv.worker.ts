import { JobData, JobType } from '@core/interfaces';
import { Invoice, Providers } from '@core/api';
import { timestamp } from '@core/helpers';
import { writeToBuffer } from 'fast-csv';
import { Job } from 'bullmq';
import { In } from 'typeorm';

export default ({ email }: { email: InstanceType<typeof Providers.Email> }) => async (job: Job) => {
  const data: JobData['host_invoice_csv'] = job.data;

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

  await email.send(
    {
      from: data.sender_email_address,
      to: data.email_address,
      subject: `Exported Invoice CSV files`,
      content: `<p>See attachments for invoice data</p>`
    },
    [
      {
        content: buffer,
        filename: `stageup-invoice-${timestamp()}`,
        contentType: 'text/csv',
        contentDisposition: 'attachment'
      }
    ]
  );
};
