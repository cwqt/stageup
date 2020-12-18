import {
  IEnvelopedData,
  IPerformance,
  IPerformanceHostInfo,
  IPerformanceStub,
  IPerformanceUserInfo,
  IUserHostInfo,
  HTTP,
} from '@eventi/interfaces';
import { Request } from 'express';
import { User } from '../models/User.model';
import { DataClient } from '../common/data';
import { Performance } from '../models/Performances/Performance.model';
import { ErrorHandler } from '../common/errors';
import { validate } from '../common/validate';
import { body } from 'express-validator';
import { Purchase } from '../models/Purchase.model';
import { createPagingData } from '../common/paginator';
import { IResLocals } from '../router';
import { BaseController, BaseArgs, IControllerEndpoint } from '../common/controller';
import AuthStrat from '../authorisation';

export default class PerformanceController extends BaseController {
  constructor(...args: BaseArgs) {
    super(...args);
  }

  createPerformance(): IControllerEndpoint<IPerformance> {
    return {
      validator: validate([body('name').not().isEmpty().withMessage('Performance must have a title!')]),
      authStrategies: [AuthStrat.none],
      controller: async (req: Request): Promise<IPerformance> => {
        const user = await User.createQueryBuilder('user').leftJoinAndSelect('user.host', 'host').getOne();

        if (!user.host) throw new ErrorHandler(HTTP.BadRequest, "You're not authorised to create performances.");

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
      validator: validate([]),
      authStrategies: [AuthStrat.none],
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
      validator: validate([]),
      authStrategies: [AuthStrat.none],
      controller: async (req: Request): Promise<IEnvelopedData<IPerformance, IPerformanceUserInfo>> => {
        const performance = await Performance.findOne(
          { _id: parseInt(req.params.pid) },
          { relations: ['host', 'host_info'] }
        );

        if (!performance) throw new ErrorHandler(HTTP.NotFound, 'Performance does not exist');

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
            throw new ErrorHandler(HTTP.Unauthorised, "You don't have access to watch this performance");

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
      validator: validate([]),
      authStrategies: [AuthStrat.none],
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
      validator: validate([]),
      authStrategies: [AuthStrat.none],
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

        if (previousPurchase) throw new ErrorHandler(HTTP.BadRequest, 'Already purchased this performance');

        const purchase = new Purchase(user, perf);
        purchase.token = perf.host_info.signing_key.signToken(perf);

        await this.dc.torm.manager.save(purchase);
      },
    };
  }

  deletePerformance(): IControllerEndpoint<void> {
    return {
      validator: validate([]),
      authStrategies: [AuthStrat.none],
      controller: async (req: Request): Promise<void> => {},
    };
  }
}
