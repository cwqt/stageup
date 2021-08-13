import { createTransport } from 'nodemailer';
import Mail, { Attachment } from 'nodemailer/lib/mailer';
import { Provider } from '../';
import marked from 'marked';
import { Logger } from 'winston';

export interface IEmailProviderConfig {
  api_key: string;
  enabled: boolean;
}

import { Service } from 'typedi';
@Service()
export class EmailProvider implements Provider<Mail> {
  name = 'Email';
  connection: Mail;
  config: IEmailProviderConfig;
  private log: Logger;

  constructor(config: IEmailProviderConfig, log: Logger) {
    this.log = log;
    this.config = config;
  }

  async connect() {
    this.connection = createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: this.config.api_key
      }
    });

    return this.connection;
  }

  async send(
    options: { from: string; to: string; subject: string; content: string; markdown?: boolean },
    attachments?: Attachment[]
  ) {
    if (this.config.enabled == false) {
      console.log(marked(options.content));
      this.log.error(`Did not send e-mail because it is disabled: %o`, options);
      return;
    }

    return this.connection.sendMail({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.markdown ? marked(options.content) : options.content,
      attachments: attachments
    });
  }

  async disconnect() {
    return this.connection.close();
  }
}
