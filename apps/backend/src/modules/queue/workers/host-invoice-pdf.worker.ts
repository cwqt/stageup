import { JobData, JobType } from '@core/interfaces';
import { Invoice, Providers } from '@core/api';
import { timestamp } from '@core/helpers';
import { Worker } from 'bullmq';
import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { ConnectionOptions } from 'tls';
import logo from '../assets/logo';

export default ({
  email,
  orm
}: {
  email: InstanceType<typeof Providers.Email>;
  orm: InstanceType<typeof Providers.Postgres>;
}) => async job => {
  try {
    const data: JobData['host_invoice_pdf'] = job.data;

    // Have to use the QB here because ticket _may_  be softDeleted & can only get deleted relations this way...
    const invoices = await orm.connection
      .createQueryBuilder(Invoice, 'invoice')
      .where('invoice._id IN (:...invoice_ids)', { invoice_ids: data.invoices })
      .innerJoinAndSelect('invoice.ticket', 'ticket')
      .innerJoinAndSelect('ticket.performance', 'performance')
      .withDeleted()
      .getMany();

    const dd: TDocumentDefinitions = {
      pageOrientation: 'landscape',
      defaultStyle: {
        font: 'Helvetica'
      },
      content: [
        {
          image: logo,
          width: 200,
          alignment: 'center'
        },
        { text: '\n' },
        {
          text: 'INVOICE SUMMARY\n\n',
          fontSize: 20,
          bold: true,
          alignment: 'center',
          decoration: 'underline',
          color: 'black'
        },
        {
          columns: [
            [
              {
                text: `Date: ${new Date().toLocaleString()}\n\n`,
                alignment: 'right'
              }
            ]
          ]
        },
        {
          style: 'tableExample',
          table: {
            heights: 15,
            widths: ['auto', '*', 'auto', '*', 'auto', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Invoice Id', style: 'tableHeader', bold: true, alignment: 'center', fillColor: '#cccccc' },
                {
                  text: 'Performance',
                  style: 'tableHeader',
                  bold: true,
                  alignment: 'center',
                  fillColor: '#cccccc'
                },
                {
                  text: 'Ticket Type',
                  style: 'tableHeader',
                  bold: true,
                  alignment: 'center',
                  fillColor: '#cccccc'
                },
                {
                  text: 'Purchase Date',
                  style: 'tableHeader',
                  bold: true,
                  alignment: 'center',
                  fillColor: '#cccccc'
                },
                { text: 'Amount', style: 'tableHeader', bold: true, alignment: 'center', fillColor: '#cccccc' },
                { text: 'Net amount', style: 'tableHeader', bold: true, alignment: 'center', fillColor: '#cccccc' },
                { text: 'Currency', style: 'tableHeader', bold: true, alignment: 'center', fillColor: '#cccccc' },
                { text: 'Status', style: 'tableHeader', bold: true, alignment: 'center', fillColor: '#cccccc' }
              ],
              ...invoices.map(invoice => [
                invoice._id,
                invoice.ticket.performance.name,
                invoice.ticket.type,
                invoice.purchased_at,
                parseInt(invoice.amount as any),
                parseInt(invoice.amount as any),
                invoice.currency,
                invoice.status
              ])
            ]
          }
        }
      ]
    };

    // Provide some default fonts to use
    // https://pdfmake.github.io/docs/0.1/fonts/standard-14-fonts/
    const printer = new PdfPrinter({
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    });
    const pdfMake = printer.createPdfKitDocument(dd, {});

    // Convert the PDFDocument into a Buffer to be able to send as a file
    // https://stackoverflow.com/a/55813735
    const buffer = await new Promise<Buffer>(res => {
      let chunks = [];

      pdfMake.on('data', chunk => chunks.push(chunk));
      pdfMake.on('end', () => res(Buffer.concat(chunks)));
      pdfMake.end();
    });

    await email.send(
      {
        from: data.sender_email_address,
        to: data.email_address,
        subject: `Exported Invoice PDF files`,
        content: `<p>See attachments for invoice data</p>`
      },
      [
        {
          content: buffer,
          filename: `stageup-invoice-${timestamp()}`, //.pdf can be here
          contentType: 'text/pdf',
          contentDisposition: 'attachment'
        }
      ]
    );
  } catch (error) {
    console.log(error);
  }
};
