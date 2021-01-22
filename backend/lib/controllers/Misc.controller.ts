import { BaseArguments, BaseController, IControllerEndpoint } from '../common/controller';
import config from '../config';
import AuthStrat from '../common/authorisation';
import { getCheck } from '../common/errors';
import { Host } from '../models/hosts/host.model';
import { IHost } from '@eventi/interfaces';

export default class MiscController extends BaseController {
  constructor(...arguments_: BaseArguments) {
    super(...arguments_);
  }

  ping(): IControllerEndpoint<string> {
    return {
      authStrategy: AuthStrat.custom(() => !config.PRODUCTION),
      controller: async request => {
        return 'Pong!';
      }
    };
  }

  dropAllData(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.custom(() => !config.PRODUCTION),
      controller: async request => {
        // Clear Influx, Redis, session store & Postgres
        if (this.dc.influx) {
          await this.dc.influx.query('DROP SERIES FROM /.*/');
        }

        if (this.dc.redis) {
          await new Promise(res => this.dc.redis.flushdb(res));
        }

        if (this.dc.session_store) {
          await new Promise(res => {
            this.dc.session_store.clear(res);
          });
        }

        await this.ORM.synchronize(true); // https://github.com/nestjs/nest/issues/409
      }
    };
  }

  verifyHost(): IControllerEndpoint<IHost> {
    return {
      authStrategy: AuthStrat.custom(() => !config.PRODUCTION),
      controller: async request => {
        const host = await getCheck(Host.findOne({ _id: Number.parseInt(request.params.hid) }));
        host.is_onboarded = true;
        await host.save();
        return host.toFull();
      }
    };
  }
}
