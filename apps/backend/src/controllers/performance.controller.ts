import {
  IEnvelopedData,
  IPerformance,
  IPerformanceHostInfo,
  IPerformanceStub,
  IPerformanceUserInfo,
  HTTP,
  ErrCode,
  HostPermission
} from '@core/interfaces';
import { User } from '../models/users/user.model';
import { Performance } from '../models/performances/performance.model';
import { ErrorHandler, getCheck } from '../common/errors';
import { BaseController, IControllerEndpoint } from '../common/controller';
import AuthStrat from '../common/authorisation';
import Validators, { body } from '../common/validate';
import { PerformancePurchase } from '../models/performances/purchase.model';

export default class PerformanceController extends BaseController {
  // router.post <IPerf> ("/hosts/:hid/performances", Perfs.createPerformance());
  createPerformance(): IControllerEndpoint<IPerformance> {
    return {
      validators: [
        body<Pick<IPerformanceStub, 'name'>>({
          name: v => Validators.Fields.isString(v)
        })
      ],
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Admin),
      controller: async req => {
        const user = await getCheck(
          User.findOne(
            {
              _id: req.session.user._id
            },
            { relations: ['host'] }
          )
        );

        const performance = await new Performance(
          {
            name: req.body.name,
            description: req.body.description ?? '',
            price: req.body.price,
            currency: req.body.currency
          },
          user
        ).setup(this.dc);

        return performance.toFull();
      }
    };
  }

  readPerformances(): IControllerEndpoint<IEnvelopedData<IPerformanceStub[], null>> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async req => {
        const envelopedPerformances = await this.ORM.createQueryBuilder(Performance, 'p').paginate();

        return {
          data: envelopedPerformances.data.map(p => p.toStub()),
          __paging_data: envelopedPerformances.__paging_data
        };
      }
    };
  }

  readPerformance(): IControllerEndpoint<IEnvelopedData<IPerformance, IPerformanceUserInfo>> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async req => {
        const performance = await getCheck(
          Performance.findOne({ _id: Number.parseInt(req.params.pid) }, { relations: ['host', 'host_info'] })
        );

        // See if current user has access/bought the performance
        let token: string;
        let previousPurchase: PerformancePurchase | null;
        if (req.session?.user._id) {
          // Check if user is part of host that created performance
          const user = await User.findOne({ _id: req.session.user._id }, { relations: ['host'] });
          const memberOfHost = user.host._id === performance.host._id;

          // Check if user has purchased the performance
          if (!memberOfHost) {
            previousPurchase = await PerformancePurchase.findOne({
              relations: ['user', 'performance'],
              where: {
                user: { _id: user._id },
                performance: { _id: performance._id }
              }
            });

            token = previousPurchase.token;
          }

          // Neither member of host, nor has a purchased token
          if (!(memberOfHost || token)) throw new ErrorHandler(HTTP.Unauthorised, ErrCode.MISSING_PERMS);

          // Sign on the fly for a member of the host
          if (memberOfHost) token = performance.host_info.signing_key.signToken(performance);
        }

        return {
          data: performance.toFull(),
          __client_data: {
            signed_token: token,
            purchase_id: previousPurchase?._id,
            // TODO: token expiry
            expires: false
          }
        };
      }
    };
  }

  readPerformanceHostInfo(): IControllerEndpoint<IPerformanceHostInfo> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async req => {
        const performance = await Performance.findOne(
          { _id: Number.parseInt(req.params.pid) },
          { relations: ['host_info'] }
        );
        const performanceHostInfo = performance.host_info;

        // Host_info eager loads signing_key, which is very convenient usually
        // but we do not wanna send keys and such over the wire
        delete performanceHostInfo.signing_key;
        return performanceHostInfo as IPerformanceHostInfo;
      }
    };
  }

  updatePerformance(): IControllerEndpoint<IPerformance> {
    return {
      validators: [],
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Admin),
      controller: async req => {
        const p = await getCheck(Performance.findOne({ _id: Number.parseInt(req.params.pid) }));

        await p.update({
          name: req.body.name,
          price: req.body.price,
          description: req.body.description
        });

        return p.toFull();
      }
    };
  }

  purchase(): IControllerEndpoint<void> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async req => {
        const user = await getCheck(User.findOne({ _id: req.session.user._id }));
        const perf = await getCheck(
          Performance.findOne({ _id: Number.parseInt(req.params.pid) }, { relations: ['host_info'] })
        );

        // Check user hasn't already purchased performance
        const previousPurchase = await PerformancePurchase.findOne({
          relations: ['user', 'performance'],
          where: {
            user: { _id: user._id },
            performance: { _id: perf._id }
          }
        });

        if (previousPurchase) throw new ErrorHandler(HTTP.BadRequest, ErrCode.DUPLICATE);

        const purchase = new PerformancePurchase(user, perf);
        purchase.token = perf.host_info.signing_key.signToken(perf);
        await this.ORM.manager.save(purchase);
      }
    };
  }

  deletePerformance(): IControllerEndpoint<void> {
    return {
      validators: [],
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Admin),
      controller: async req => {
        const perf = await getCheck(Performance.findOne({ _id: Number.parseInt(req.params.pid) }));
        await perf.remove();
      }
    };
  }
}
