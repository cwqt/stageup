import { EMAIL_PROVIDER, Mail } from '@core/api';
import { Inject, Service } from 'typedi';
import { WorkerScript } from '.';

@Service()
export default class extends WorkerScript<'send_email'> {
  constructor(@Inject(EMAIL_PROVIDER) private email: Mail) {
    super();

    this.script = async job => {
      this.email.send(job.data);
    };
  }
}
