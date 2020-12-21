import { Request } from 'express';
import { BaseArgs, BaseController, IControllerEndpoint } from '../common/controller';
import config from '../config';
import AuthStrat from '../authorisation';

export default class MiscController extends BaseController {
  constructor(...args: BaseArgs) {
    super(...args);
  }

  ping():IControllerEndpoint<string> {
    return  {
      authStrategy: AuthStrat.none,
      controller: async (req:Request) => {
        return "Pong!"
      }
    }
  }

  dropAllData():IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.custom(() => !config.PRODUCTION),
      controller: async (req:Request) => {
        // Clear Influx, Redis, Postgres & session store 
        await this.dc.influx?.query(`DROP SERIES FROM /.*/`);
        await new Promise((res) => this.dc.redis.flushdb(res));
        await this.dc.torm.synchronize(true);//https://github.com/nestjs/nest/issues/409
        await new Promise((res) => this.dc.session_store.clear(res));
      }
    }
  }
}
