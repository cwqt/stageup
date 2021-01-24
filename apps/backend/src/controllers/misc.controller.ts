import { BaseController, IControllerEndpoint } from '../common/controller';
import { Environment } from '../config';
import AuthStrat from '../common/authorisation';
import { getCheck } from '../common/errors';
import { Host } from '../models/hosts/host.model';
import { IHost } from '@eventi/interfaces';

export default class MiscController extends BaseController {
  ping(): IControllerEndpoint<string> {
    return {
      authStrategy: AuthStrat.not(AuthStrat.isEnv(Environment.Production)),
      controller: async req => {
        return 'Pong!';
      }
    };
  }

  dropAllData(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.not(AuthStrat.isEnv(Environment.Production)),
      controller: async req => {
        // Clear Influx, Redis, session store & Postgres
        if (this.dc.influx) {
          await this.dc.influx.query('DROP SERIES FROM /.*/');
        }

        if (this.dc.redis) {
          await new Promise(resolve => this.dc.redis.flushdb(resolve));
        }

        if (this.dc.session_store) {
          await new Promise(resolve => {
            this.dc.session_store.clear(resolve);
          });
        }

        await this.ORM.synchronize(true); // https://github.com/nestjs/nest/issues/409
      }
    };
  }

  verifyHost(): IControllerEndpoint<IHost> {
    return {
      authStrategy: AuthStrat.not(AuthStrat.isEnv(Environment.Production)),
      controller: async req => {
        const host = await getCheck(Host.findOne({ _id: Number.parseInt(req.params.hid) }));
        host.is_onboarded = true;
        await host.save();
        return host.toFull();
      }
    };
  }
}
