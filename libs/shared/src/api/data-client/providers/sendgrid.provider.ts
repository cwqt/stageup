import { createTransport } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { Provider } from '../';

export interface ISendGridProviderConfig {
  username: string;
  api_key: string;
  enabled: boolean;
}

export default class SendGrid implements Provider<Mail> {
  name = 'SendGrid';
  connection: Mail;
  config: ISendGridProviderConfig;

  constructor(config: ISendGridProviderConfig) {
    this.config = config;
  }

  async connect() {
    this.connection = createTransport({
      service: 'SendGrid',
      auth: {
        user: this.config.username,
        pass: this.config.api_key
      }
    });

    return this.connection;
  }

  async disconnect() {
    return this.connection.close();
  }
}
