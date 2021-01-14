import { Request } from 'express';
import { BaseArgs, BaseController, IControllerEndpoint } from '../common/controller';
import config from '../config';
import AuthStrat from '../common/authorisation';
import { body, params, query, object, array, single } from '../common/validate';
import { HTTP, IAddress, IContactInfo, IPerson, IPersonInfo } from '@eventi/interfaces';
import { ErrorHandler } from '../common/errors';

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

  verifyHost(): IControllerEndpoint<any> {
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
}
