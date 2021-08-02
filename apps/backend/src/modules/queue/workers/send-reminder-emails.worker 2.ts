import { Invoice, Providers, Ticket } from '@core/api';
import { timestamp, unix, i18n } from '@core/helpers';
import { JobData } from '@core/interfaces';
import { pdf } from '../pdf';

export default ({
  email,
  orm,
  i18n
}: {
  email: InstanceType<typeof Providers.Email>;
  orm: InstanceType<typeof Providers.Postgres>;
  i18n: InstanceType<typeof Providers.i18n>;
}) => async job => {
  try {
    const data: JobData['send_reminder_emails'] = job.data;

    const stream = await orm.connection
      .createQueryBuilder(Invoice, 'invoice')
      .innerJoinAndSelect('invoice.user', 'user')
      .innerJoinAndSelect('invoice.ticket', 'ticket')
      .innerJoinAndSelect('ticket.performance', 'performance')
      .where('ticket.performance__id = :pid', { pid: data.performance_id })
      .iterate(async row => {
        const dateString = i18n.date(unix(data.premier_date), row.user_locale);
        if (data.type === '24 hours') {
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
        } else if (data.type === '15 minutes') {
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
  } catch (error) {
    console.log(error);
  }
};
