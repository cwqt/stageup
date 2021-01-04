import {
  IEnvelopedData,
  IPerformance,
  IPerformanceHostInfo,
  IPerformanceStub,
  IPerformanceUserInfo,
  HTTP,
  ErrCode,
} from '@eventi/interfaces';
import { Request } from 'express';
import { User } from '../models/Users/User.model';
import { Performance } from '../models/Performances/Performance.model';
import { ErrorHandler } from '../common/errors';
import { createPagingData } from '../common/paginator';
import { IResLocals } from '../router';
import { BaseController, BaseArgs, IControllerEndpoint } from '../common/controller';
import AuthStrat from '../authorisation';
import { body } from '../common/validate';
import Validators from '../common/validators';
import { Purchase } from '../models/Purchase.model';

export default class PerformanceController extends BaseController {
  constructor(...args: BaseArgs) {
    super(...args);
  }

  createPerformance(): IControllerEndpoint<IPerformance> {
    return {
      validators: [
        body<Pick<IPerformanceStub, "name">>({
          name: v => Validators.Fields.isString(v)
        })
      ],
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<IPerformance> => {
        const user = await User.createQueryBuilder('user').leftJoinAndSelect('user.host', 'host').getOne();

        if (!user.host) throw new ErrorHandler(HTTP.BadRequest, ErrCode.MISSING_PERMS);

        const performance = await new Performance(
          {
            name: req.body.name,
            description: req.body.description ?? '',
            price: req.body.price,
            currency: req.body.currency,
          },
          user
        ).setup(this.dc);

        return performance.toFull();
      },
    };
  }

  readPerformances(): IControllerEndpoint<IEnvelopedData<IPerformanceStub[], null>> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async (req: Request, _, locals: IResLocals): Promise<IEnvelopedData<IPerformanceStub[], null>> => {
        const performances = await Performance.find({
          take: locals.pagination.per_page,
          skip: locals.pagination.page * locals.pagination.per_page,
          relations: ['host'],
        });

        return {
          data: performances.map((p: Performance) => p.toStub()),
          __paging_data: createPagingData(req.path, 100, locals.pagination.per_page),
        };
      },
    };
  }

  readPerformance(): IControllerEndpoint<IEnvelopedData<IPerformance, IPerformanceUserInfo>> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<IEnvelopedData<IPerformance, IPerformanceUserInfo>> => {
        const performance = await Performance.findOne(
          { _id: parseInt(req.params.pid) },
          { relations: ['host', 'host_info'] }
        );

        if (!performance) throw new ErrorHandler(HTTP.NotFound, ErrCode.NOT_FOUND);

        // see if current user has access/bought the performance
        let token: string;
        let memberOfHost: boolean = false;
        let previousPurchase: Purchase | null;
        if (req.session?.user._id) {
          // check if user is part of host that created performance
          const user = await User.findOne({ _id: req.session.user._id }, { relations: ['host'] });
          if (user.host._id == performance.host._id) memberOfHost = true;

          // check if user has purchased the performance
          if (!memberOfHost) {
            previousPurchase = await Purchase.findOne({
              relations: ['user', 'performance'],
              where: {
                user: { _id: user._id },
                performance: { _id: performance._id },
              },
            });

            token = previousPurchase.token;
          }

          // neither member of host, nor has a purchased token
          if (!(memberOfHost || token))
            throw new ErrorHandler(HTTP.Unauthorised, ErrCode.MISSING_PERMS);

          // sign on the fly for a member of the host
          if (memberOfHost) token = performance.host_info.signing_key.signToken(performance);
        }

        return {
          data: performance.toFull(),
          __client_data: {
            signed_token: token,
            purchase_id: previousPurchase?._id,
            // TODO: token expiry
            expires: false,
          },
        };
      },
    };
  }

  readPerformanceHostInfo(): IControllerEndpoint<IPerformanceHostInfo> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<IPerformanceHostInfo> => {
        const performance = await Performance.findOne({ _id: parseInt(req.params.pid) }, { relations: ['host_info'] });
        const performanceHostInfo = performance.host_info;

        // host_info eager loads signing_key, which is very convenient usually
        // but we do not wanna send keys and such over the wire
        delete performanceHostInfo.signing_key;

        return performanceHostInfo as IPerformanceHostInfo;
      },
    };
  }

  purchase(): IControllerEndpoint<void> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<void> => {
        const user = await User.findOne({ _id: req.session.user._id });
        const perf = await Performance.findOne({ _id: parseInt(req.params.pid) }, { relations: ['host_info'] });

        //check user hasn't already purchased performance
        const previousPurchase = await Purchase.findOne({
          relations: ['user', 'performance'],
          where: {
            user: { _id: user._id },
            performance: { _id: perf._id },
          },
        });

        if (previousPurchase) throw new ErrorHandler(HTTP.BadRequest, ErrCode.DUPLICATE);

        const purchase = new Purchase(user, perf);
        purchase.token = perf.host_info.signing_key.signToken(perf);

        await this.dc.torm.manager.save(purchase);
      },
    };
  }

  deletePerformance(): IControllerEndpoint<void> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async (req: Request): Promise<void> => {},
    };
  }
}
