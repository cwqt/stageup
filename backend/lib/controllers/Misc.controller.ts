import { Request } from 'express';
import { BaseArgs, BaseController, IControllerEndpoint } from '../common/controller';
import config from '../config';
import AuthStrat from '../common/authorisation';
import { body, params, query, object, array, single } from '../common/validate';
import { HTTP, IAddress, IContactInfo, IPerson, IPersonInfo, IHost, IHostStub , HostOnboardingState} from '@eventi/interfaces';
import { ErrorHandler, getCheck } from '../common/errors';
import { hostname } from 'os';
import { Host } from '../models/Hosts/Host.model';
import { HostOnboardingProcess } from '../models/Hosts/Onboarding.model';

export default class MiscController extends BaseController {
  constructor(...args: BaseArgs) {
    super(...args);
  }

  ping(): IControllerEndpoint<string> {
    return {
      authStrategy: AuthStrat.none,
      controller: async (req: Request) => {
        return 'Pong!';
      },
    };
  }

  dropAllData(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.custom(() => !config.PRODUCTION),
      controller: async (req: Request) => {
        // Clear Influx, Redis, Postgres & session store
        await this.dc.influx?.query(`DROP SERIES FROM /.*/`);
        await new Promise(res => this.dc.redis.flushdb(res));
        await this.ORM.synchronize(true); //https://github.com/nestjs/nest/issues/409
        await new Promise(res => this.dc.session_store.clear(res));
      },
    };
  }

  test(): IControllerEndpoint<any> {
    return {
      validators: [
        body({
          name: v => v.isString(),
          addresses: v => v.custom(array({
            v: v => v.isInt()
          }))
        })
      ],
      authStrategy: AuthStrat.none,
      controller: async (req: Request) => {
        return true;
      },
    };
  }
  // router.get<void>("/verifyhost/:oid",Misc.verifyHost());
  verifyHost(): IControllerEndpoint<any> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async (req: Request) => {
      const host = await getCheck(Host.findOne({ _id: parseInt(req.params.oid) }))
            host.is_onboarded = true;
            await host.save();
            return host.toFull();
      },
    };
  }
}
