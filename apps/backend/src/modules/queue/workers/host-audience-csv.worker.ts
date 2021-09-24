import { HostService } from '@backend/modules/host/host.service';
import { ConsentableType, ConsentOpt } from '@core/interfaces';
import {
  EMAIL_PROVIDER,
  I18N_PROVIDER,
  i18n,
  User,
  UserHostMarketingConsent,
  Mail,
  POSTGRES_PROVIDER
} from '@core/api';
import { timestamp } from '@core/helpers';
import { writeToBuffer } from 'fast-csv';
import { Connection } from 'typeorm';
import { AUTOGEN_i18n_TOKEN_MAP } from '@backend/i18n/i18n-tokens.autogen';
import { Inject, Service } from 'typedi';
import { WorkerScript } from '.';
import { unix } from '@core/helpers';

@Service()
export default class extends WorkerScript<'host_audience_csv'> {
  constructor(
    @Inject(POSTGRES_PROVIDER) private ORM: Connection,
    @Inject(EMAIL_PROVIDER) private email: Mail,
    @Inject(I18N_PROVIDER) private i18n: i18n<AUTOGEN_i18n_TOKEN_MAP>,
    private hostService: HostService
  ) {
    super();

    this.script = async job => {
      const { data } = job;

      // Translate all labels
      const labels = [
        this.i18n.translate('@@host.audience_csv.username', data.locale),
        this.i18n.translate('@@host.audience_csv.email', data.locale)
      ];
      const csv = [labels.map(v => v.replace(' ', '_'))];

      // Data retrieval put inside worker to keep controller method simpler and faster
      data.audience_ids
        ? // If a selection of audience IDs has been made, use that.
          await this.ORM.createQueryBuilder(User, 'user')
            .where('user._id IN (:...audience_list)', { audience_list: data.audience_ids })
            .select(['user.email_address', 'user.username'])
            .iterate(row => {
              csv.push([row.user_username, row.user_email_address]);
            })
        : // Otherwise get all audience/users of this host.
          await this.ORM.createQueryBuilder(User, 'user')
            .innerJoinAndSelect(UserHostMarketingConsent, 'consent', 'consent.user__id = user._id')
            .where('consent.host__id = :host_id', { host_id: data.host_id })
            .andWhere('consent.type = :type', { type: 'host_marketing' as ConsentableType })
            .andWhere('consent.opt_status != :opt_status', { opt_status: 'hard-out' as ConsentOpt })
            .select(['user.email_address', 'user.username'])
            .iterate(row => {
              csv.push([row.user_username, row.user_email_address]);
            });

      const buffer = await writeToBuffer(csv);
      const lastUpdated = await this.hostService.readHostMarketingLastUpdate(data.host_id);

      await this.email.send(
        {
          from: data.sender_email_address,
          to: data.receiver_email_address,
          subject: this.i18n.translate('@@email.host.audience_csv__subject', data.locale),
          content: this.i18n.translate('@@email.host.audience_csv__content', data.locale, {
            last_updated: i18n.date(unix(lastUpdated), data.locale)
          })
        },
        [
          {
            content: buffer,
            filename: `${this.i18n.translate('@@email.host.audience_csv__filename', data.locale)}-${timestamp()}.csv`,
            contentType: 'text/csv',
            contentDisposition: 'attachment'
          }
        ]
      );
    };
  }
}
