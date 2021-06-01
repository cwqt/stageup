import { ILocale, JobData, JobType } from '@core/interfaces';
import { Invoice, Providers } from '@core/api';
import { prettifyMoney, timestamp, unix } from '@core/helpers';
import { writeToBuffer } from 'fast-csv';
import { Job } from 'bullmq';
import { In } from 'typeorm';

export default ({
  email,
  i18n
}: {
  email: InstanceType<typeof Providers.Email>;
  i18n: InstanceType<typeof Providers.i18n>;
}) => async (job: Job) => {
  const data: JobData['host_invoice_csv'] = job.data;

  const invoices = await Invoice.find({
    where: { _id: In(data.invoice_ids) },
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

  // Translate all labels
  const labels = [
    i18n.translate('@@host.invoice_csv.invoice_id', data.locale),
    i18n.translate('@@host.invoice_csv.performance_name', data.locale),
    i18n.translate('@@host.invoice_csv.ticket_type', data.locale),
    i18n.translate('@@host.invoice_csv.purchased_at', data.locale),
    i18n.translate('@@host.invoice_csv.amount', data.locale),
    i18n.translate('@@host.invoice_csv.net_amount', data.locale),
    i18n.translate('@@host.invoice_csv.currency', data.locale),
    i18n.translate('@@host.invoice_csv.status', data.locale)
  ];

  const csv = [
    // First line of the CSV should be labels, replacing all spaces with underscores
    labels.map(v => v.replace(' ', '_')),
    ...invoices.map(i => [
      i._id,
      i.ticket.performance.name,
      i18n.translate(`@@ticket_type.${i.ticket.type}`, data.locale),
      i18n.date(unix(i.purchased_at), data.locale),
      prettifyMoney(i.amount, i.currency),
      prettifyMoney(i.amount, i.currency), // IMPORTANT: net_amount use subscription tier from invoice
      i.currency,
      i18n.translate(`@@payment_status.${i.status}`, data.locale)
    ])
  ];

  const buffer = await writeToBuffer(csv);

  await email.send(
    {
      from: data.sender_email_address,
      to: data.email_address,
      subject: i18n.translate('@@email.host.invoice_csv__subject', data.locale),
      content: i18n.translate('@@email.host.invoice_csv__content', data.locale)
    },
    [
      {
        content: buffer,
        filename: `${i18n.translate('@@email.host.invoice_csv__filename', data.locale)}-${timestamp()}`,
        contentType: 'text/csv',
        contentDisposition: 'attachment'
      }
    ]
  );
};
