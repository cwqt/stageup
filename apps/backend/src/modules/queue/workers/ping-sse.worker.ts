import { AUTOGEN_i18n_TOKEN_MAP } from '@backend/i18n/i18n-tokens.autogen';
import { EMAIL_PROVIDER, Invoice, PostgresProvider, POSTGRES_PROVIDER, Provider, i18n, Mail, SSE } from '@core/api';
import { unix } from '@core/helpers';
import { SseEventType } from '@core/interfaces';
import { I18N_PROVIDER, SSE_HUB_PROVIDER } from 'libs/shared/src/api/data-client/tokens';
import { Inject, Service } from 'typedi';
import { Connection } from 'typeorm';
import { WorkerScript } from '.';

@Service()
export default class extends WorkerScript<'ping_sse'> {
  constructor(
    @Inject(SSE_HUB_PROVIDER) private sse: SSE    
  ) {
    super();

    this.script = async job => {
      const { data } = job;

      this.sse.emit(data.asset_id, { type: SseEventType.Ping, data: 'ping' });
    };
  }
}
