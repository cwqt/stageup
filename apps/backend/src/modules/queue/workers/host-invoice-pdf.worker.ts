import { AUTOGEN_i18n_TOKEN_MAP } from '@backend/i18n/i18n-tokens.autogen';
import { EMAIL_PROVIDER, i18n, I18N_PROVIDER, Invoice, PostgresProvider, POSTGRES_PROVIDER, Mail } from '@core/api';
import { timestamp, unix } from '@core/helpers';
import { JobData } from '@core/interfaces';
import { Inject, Service } from 'typedi';
import { Connection } from 'typeorm';
import { WorkerScript } from '.';
import { pdf } from '../pdf';

@Service()
export default class extends WorkerScript<'host_invoice_pdf'> {
  constructor(
    @Inject(POSTGRES_PROVIDER) private ORM: Connection,
    @Inject(EMAIL_PROVIDER) private email: Mail,
    @Inject(I18N_PROVIDER) private i18n: i18n<AUTOGEN_i18n_TOKEN_MAP>
  ) {
    super();

    this.script = async job => {
      const { data } = job;

      // Have to use the QB here because ticket _may_ be softDeleted & can only get deleted relations this way...
      const stream = await this.ORM.createQueryBuilder(Invoice, 'invoice')
        .where('invoice._id IN (:...invoice_ids)', { invoice_ids: data.invoice_ids })
        .innerJoinAndSelect('invoice.ticket', 'ticket')
        .innerJoinAndSelect('ticket.performance', 'performance')
        .withDeleted()
        .stream();

      const rows = await new Promise<any[]>((res, rej) => {
        const rows = [];
        // Stream row by row in large data-sets
        stream.on('open', () => console.log('stream started!'));

        // streaming data returns the rows as raw data, formatted like alias_column_name
        // where alias is the name of the entity aliased in createQueryBuilder, e.g. "invoice__id" etc.
        stream.on('data', row => {
          rows.push([
            row.invoice__id,
            row.performance_name,
            row.ticket_type,
            i18n.date(unix(row.invoice_purchased_at), data.locale),
            i18n.money(row.invoice_amount, row.invoice_currency),
            i18n.money(row.invoice_amount, row.invoice_currency),
            row.invoice_currency,
            row.invoice_status
          ]);
        });

        stream.on('error', err => (console.log(err), stream.destroy(), rej()));
        stream.on('end', () => (stream.destroy(), res(rows)));
      });

      const buffer = await pdf.generate(
        {
          metadata: {
            [i18n.translate('@@host.invoice_pdf.created_at', data.locale)]: i18n.date(new Date(), data.locale),
            [i18n.translate('@@host.invoice_pdf.total_rows', data.locale)]: rows.length
          }
        },
        [
          { text: '', margin: [0, 10, 0, 10] },
          {
            layout: 'lightHorizontalLines',
            fontSize: 10,
            table: {
              body: [
                [
                  { style: 'tableHeader', text: i18n.translate('@@host.invoice_pdf.invoice_id', data.locale) },
                  { style: 'tableHeader', text: i18n.translate('@@host.invoice_pdf.performance_name', data.locale) },
                  { style: 'tableHeader', text: i18n.translate('@@host.invoice_pdf.ticket_type', data.locale) },
                  { style: 'tableHeader', text: i18n.translate('@@host.invoice_pdf.purchased_at', data.locale) },
                  { style: 'tableHeader', text: i18n.translate('@@host.invoice_pdf.amount', data.locale) },
                  { style: 'tableHeader', text: i18n.translate('@@host.invoice_pdf.net_amount', data.locale) },
                  { style: 'tableHeader', text: i18n.translate('@@host.invoice_pdf.currency', data.locale) },
                  { style: 'tableHeader', text: i18n.translate('@@host.invoice_pdf.status', data.locale) }
                ],
                ...rows
              ]
            }
          }
        ],
        {
          pageSize: 'A4',
          pageMargins: 10,
          styles: {
            tableHeader: {
              bold: true,
              margin: 2,
              color: 'black'
            }
          }
        }
      );

      // Provide some default fonts to use
      // https://pdfmake.github.io/docs/0.1/fonts/standard-14-fonts/
      await email.send(
        {
          from: data.sender_email_address,
          to: data.email_address,
          subject: i18n.translate('@@email.host.invoice_pdf__subject', data.locale),
          content: i18n.translate('@@email.host.invoice_pdf__content', data.locale)
        },
        [
          {
            content: buffer,
            filename: `${i18n.translate('@@email.host.invoice_pdf__filename', data.locale)}-${timestamp()}`,
            contentType: 'text/pdf',
            contentDisposition: 'attachment'
          }
        ]
      );
    };
  }
}
