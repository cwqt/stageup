import { Primitive } from '@core/interfaces';
import PdfPrinter from 'pdfmake';
import { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import logo from '../assets/logo';

const generate = async (
  options: {
    metadata: { [index: string]: Primitive };
  },
  content: Content[],
  def?: Omit<TDocumentDefinitions, 'content'>
): Promise<Buffer> => {
  const header: Content = {
    alignment: 'justify',
    columns: [
      {
        image: logo,
        width: 200
      },
      {
        // layout: 'noBorders',
        alignment: 'right',
        margin: [20, 0, 0, 0],
        width: '*',
        table: {
          widths: ['*', '*'],
          body: Object.entries(options.metadata).map(([key, value]) => {
            return [
              { bold: true, text: key, border: [false, false, false, false] },
              { text: value, border: [false, false, false, false] }
            ];
          })
          // Gives us something like
          // body: [
          //   [{ bold: true, text: 'Meta 1'}, 'Column 2'],
          //   [{ bold: true, text: 'Meta 2'}, 'Another one here']
          // ]
        }
      }
    ]
  };

  const dd: TDocumentDefinitions = {
    defaultStyle: {
      font: 'Helvetica'
    },
    footer: (currentPage, pageCount) => ({
      text: `${currentPage.toString() + ' of ' + pageCount}`,
      margin: [20, 0, 0, 0]
    }),
    header: (currentPage, pageCount, pageSize) => '',
    content: [header, ...content],
    ...(def || {})
  };

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

  return buffer;
};

export const pdf = { generate: generate };
