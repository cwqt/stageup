import { AUTOGEN_i18n_TOKEN_MAP } from '@backend/i18n/i18n-tokens.autogen';
import { EMAIL_PROVIDER, Invoice, PostgresProvider, POSTGRES_PROVIDER, Provider, i18n, Mail } from '@core/api';
import { unix } from '@core/helpers';
import { I18N_PROVIDER } from 'libs/shared/src/api/data-client/tokens';
import { Inject, Service } from 'typedi';
import { Connection } from 'typeorm';
import { WorkerScript } from '.';

@Service()
export default class extends WorkerScript<'send_reminder_emails'> {
  constructor(
    @Inject(POSTGRES_PROVIDER) private ORM: Connection,
    @Inject(EMAIL_PROVIDER) private email: Mail,
    @Inject(I18N_PROVIDER) private i18n: i18n<AUTOGEN_i18n_TOKEN_MAP>
  ) {
    super();

    this.script = async job => {
      const { data } = job;

      await this.ORM.createQueryBuilder(Invoice, 'invoice')
        .innerJoinAndSelect('invoice.user', 'user')
        .innerJoinAndSelect('invoice.ticket', 'ticket')
        .innerJoinAndSelect('ticket.performance', 'performance')
        .where('ticket.performance__id = :pid', { pid: data.performance_id })
        .iterate(async row => {
          const dateString = i18n.date(unix(data.premier_date), row.user_locale);
          if (data.type === '24_HOURS') {
            await email.send({
              from: data.sender_email_address,
              to: row.user_email_address,
              subject: i18n.translate('@@email.user.one_day_performance_reminder__subject', row.user_locale, {
                performance_name: row.performance_name
              }),
              content: i18n.translate('@@email.user.one_day_performance_reminder__content', row.user_locale, {
                performance_name: row.performance_name,
                user_username: row.user_username,
                premier_time: dateString
              })
            });
          } else if (data.type === '15_MINUTES') {
            await email.send({
              from: data.sender_email_address,
              to: row.user_email_address,
              subject: i18n.translate('@@email.user.fifteen_minute_performance_reminder__subject', row.user_locale),
              content: i18n.translate('@@email.user.fifteen_minute_performance_reminder__content', row.user_locale, {
                performance_name: row.performance_name,
                user_username: row.user_username,
                premier_time: dateString.split(' ').pop(), // Since it is showing 'today', only display the time
                url: data.url
              })
            });
          }
        });
    };
  }
}
