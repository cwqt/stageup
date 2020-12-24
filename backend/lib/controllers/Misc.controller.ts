import { Request } from 'express';
import { BaseArgs, BaseController, IControllerEndpoint } from '../common/controller';
import config from '../config';
import AuthStrat from '../authorisation';
import { validate, body, params, query, object, array, single } from '../common/test';
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
        await new Promise((res) => this.dc.redis.flushdb(res));
        await this.dc.torm.synchronize(true); //https://github.com/nestjs/nest/issues/409
        await new Promise((res) => this.dc.session_store.clear(res));
      },
    };
  }

  test(): IControllerEndpoint<any> {
    return {
      authStrategy: AuthStrat.none,
      controller: async (req: Request) => {
        interface Test extends IPersonInfo {
          contact_info: IContactInfo;
        }

        let results = await validate([
          body<Test>({
            first_name: (v) => v.isString(),
            last_name: (v) => v.isString(),
            title: (v) => v.isString(),
            contact_info: (v) =>
              v.notEmpty().custom(
                single<IContactInfo>({
                  mobile_number: (v) => v.isInt(),
                  landline_number: (v) => v.isInt(),
                  addresses: (v) =>
                    v.custom(
                      array<Partial<IAddress>>({
                        street_name: (v) => v.isString(),
                        street_number: (v) => v.isInt(),
                      })
                    ),
                })
              ),
          }),
        ])(req);

        console.log(results);
        throw new ErrorHandler(HTTP.BadRequest, 'Bad input', results);
      },
    };
  }
}
