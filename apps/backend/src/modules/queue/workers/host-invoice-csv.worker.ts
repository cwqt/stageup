import { ILocale, JobData, JobType } from '@core/interfaces';
import { EMAIL_PROVIDER, I18N_PROVIDER, i18n, Invoice, Mail, PostgresProvider, POSTGRES_PROVIDER } from '@core/api';
import { timestamp, unix } from '@core/helpers';
import { writeToBuffer } from 'fast-csv';
import { Job } from 'bullmq';
import { In } from 'typeorm';
import { AUTOGEN_i18n_TOKEN_MAP } from '@backend/i18n/i18n-tokens.autogen';
import { Inject, Service } from 'typedi';
import { WorkerScript } from '.';

@Service()
export default class extends WorkerScript<'host_invoice_csv'> {
  constructor(
    @Inject(POSTGRES_PROVIDER) private ORM: PostgresProvider,
    @Inject(EMAIL_PROVIDER) private email: Mail,
    @Inject(I18N_PROVIDER) private i18n: i18n<AUTOGEN_i18n_TOKEN_MAP>
  ) {
    super();

    this.script = async job => {
      const { data } = job;

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
          i18n.translate(`@@ticket_type.${i.ticket.type}` as any, data.locale),
          i18n.date(unix(i.purchased_at), data.locale),
          i18n.money(i.amount, i.currency),
          i18n.money(i.amount, i.currency), // IMPORTANT: net_amount use subscription tier from invoice
          i.currency,
          i18n.translate(`@@payment_status.${i.status}` as any, data.locale)
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
  }
}
