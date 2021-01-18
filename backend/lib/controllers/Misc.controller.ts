import { BaseArgs, BaseController, IControllerEndpoint } from '../common/controller';
import config from '../config';
import AuthStrat from '../common/authorisation';
import { getCheck } from '../common/errors';
import { Host } from '../models/Hosts/Host.model';
import { IHost } from '@eventi/interfaces';


export default class MiscController extends BaseController {
  constructor(...args: BaseArgs) {
    super(...args);
  }

  ping(): IControllerEndpoint<string> {
    return {
      authStrategy: AuthStrat.none,
      controller: async req => {
        return 'Pong!';
      },
    };
  }

  dropAllData(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.custom(async () => !config.PRODUCTION),
      controller: async req => {
        // Clear Influx, Redis, Postgres & session store
        await this.dc.influx?.query(`DROP SERIES FROM /.*/`);
        await new Promise(res => this.dc.redis.flushdb(res));
        await this.ORM.synchronize(true); //https://github.com/nestjs/nest/issues/409
      },
    };
  }

  verifyHost(): IControllerEndpoint<IHost> {
    return {
      authStrategy: AuthStrat.none,
      // authStrategy: AuthStrat.custom(() => !config.PRODUCTION),
      controller: async req => {
        const host = await getCheck(Host.findOne({ _id: parseInt(req.params.hid) }))
        host.is_onboarded = true;
        await host.save();
        return host.toFull();
      },
    };
  }
}
