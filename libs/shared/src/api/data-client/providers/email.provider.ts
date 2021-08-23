import marked from 'marked';
import { createTransport, Transporter } from 'nodemailer';
import { Attachment } from 'nodemailer/lib/mailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import Container, { Service } from 'typedi';
import { Provider } from '../';
import { LOGGING_PROVIDER } from '../tokens';
import { Logger } from './logging.provider';

export interface Mail {
  send: (
    options: { from: string; to: string; subject: string; content: string; markdown?: boolean },
    attachments?: Attachment[]
  ) => Promise<void>;
}

export interface ISendGridMailProviderConfig {
  api_key: string;
  enabled: boolean;
}

@Service()
export class SendGridMailProvider implements Provider<Mail> {
  name = 'SendGrid';
  connection: Mail;
  config: ISendGridMailProviderConfig;

  private log: Logger;
  private transport: Transporter<SMTPTransport.SentMessageInfo>;

  constructor(config: ISendGridMailProviderConfig) {
    this.config = config;
    this.log = Container.get(LOGGING_PROVIDER);
  }

  async connect() {
    this.transport = createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: this.config.api_key
      }
    });

    return this;
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

    await this.transport.sendMail({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.markdown ? marked(options.content) : options.content,
      attachments: attachments
    });

    return;
  }

  async disconnect() {
    return this.transport.close();
  }
}
