import {
  IEnvelopedData,
  IPerformance,
  IPerformanceHostInfo,
  IPerformanceStub,
  DtoAccessToken,
  HTTP,
  ErrCode,
  HostPermission,
  DtoCreatePerformance,
  Visibility,
  JobType,
  IScheduleReleaseJobData,
  TokenProvisioner
} from '@core/interfaces';
import { User } from '../models/users/user.model';
import { Performance } from '../models/performances/performance.model';
import { Auth, ErrorHandler, getCheck } from '@core/shared/api';
import { BaseController, IControllerEndpoint } from '@core/shared/api';
import { Validators, body, query } from '@core/shared/api';
import { PerformancePurchase } from '../models/performances/purchase.model';

import AuthStrat from '../common/authorisation';
import IdFinderStrat from '../common/authorisation/id-finder-strategies';
import { BackendDataClient } from '../common/data';
import Queue from '../common/queue';
import { AccessToken } from '../models/performances/access-token.model';
import idFinderStrategies from '../common/authorisation/id-finder-strategies';

export default class PerformanceController extends BaseController<BackendDataClient> {
  // router.post <IPerf> ("/hosts/:hid/performances", Perfs.createPerformance());
  createPerformance(): IControllerEndpoint<IPerformance> {
    return {
      validators: [body<DtoCreatePerformance>(Validators.Objects.DtoCreatePerformance())],
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

        return await this.ORM.transaction(async txc => {
          const performance = await new Performance(req.body, user);
          await performance.setup(this.dc.connections, txc);
          await txc.save(performance);

          // Push premiere to job queue for automated release
          Queue.enqueue<IScheduleReleaseJobData>({
            type: JobType.ScheduleRelease,
            data: {
              _id: performance._id
            },
            options: {
              // Use a repeating job with a limit of 1 to activate the scheduler
              repeat: {
                cron: '* * * * *',
                startDate: performance.premiere_date,
                limit: 1
              }
            }
          });

          return performance.toFull();
        });
      }
    };
  }

  //router.get <IE<IPerfS[], null>> ("/performances", Perfs.readPerformances());
  readPerformances(): IControllerEndpoint<IEnvelopedData<IPerformanceStub[]>> {
    return {
      validators: [
        query<{
          search_query: string;
        }>({
          search_query: v => v.optional({ nullable: true }).isString()
        })
      ],
      authStrategy: AuthStrat.none,
      controller: async req => {
        return await this.ORM.createQueryBuilder(Performance, 'p')
          .innerJoinAndSelect('p.host', 'host')
          .where('p.name LIKE :name', { name: req.query.search_query ? `%${req.query.search_query as string}%` : '%' })
          .andWhere('p.visibility = :state', { state: Visibility.Public })
          .paginate(p => p.toStub());
      }
    };
  }

  readPerformance(): IControllerEndpoint<IEnvelopedData<IPerformance, DtoAccessToken>> {
    return {
      validators: [],
      authStrategy: AuthStrat.isLoggedIn,
      controller: async (req, dc) => {
        const performance = await getCheck(
          Performance.findOne({ _id: req.params.pid }, { relations: ['host', 'host_info'] })
        );
        
        // See if current user has access the performance by virtue of owning an Access Token
        let token: AccessToken = await AccessToken.findOne({
          relations: ['user'],
          where: {
            user: {
              _id: req.session.user._id
            }
          },
          select: {
            user: { _id: true }
          }
        });

        if (!token) {
          // Provision a token on the fly for all host members
          const [isMemberOfHost, passthru] = await AuthStrat.runner(
            {
              hid: async () => performance.host._id
            },
            AuthStrat.isMemberOfHost(m => m.hid)
          )(req, dc);

          if (isMemberOfHost) {
            token = new AccessToken(passthru.uhi.user, performance, passthru.uhi.user, TokenProvisioner.User).sign(
              performance.host_info.signing_key
            );
          }
        }

        // return 404 barring the user has a token if the performance is private
        if(!token && performance.visibility == Visibility.Private) throw new ErrorHandler(HTTP.NotFound);

        return {
          data: performance.toFull(),
          __client_data: token.toFull()
        };
      }
    };
  }

  readPerformanceHostInfo(): IControllerEndpoint<IPerformanceHostInfo> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async req => {
        const performance = await Performance.findOne({ _id: req.params.pid }, { relations: ['host_info'] });
        const performanceHostInfo = performance.host_info;

        // Host_info eager loads signing_key, which is very convenient usually
        // but we do not wanna send keys and such over the wire
        delete performanceHostInfo.signing_key;
        return performanceHostInfo as IPerformanceHostInfo;
      }
    };
  }

  updateVisibility(): IControllerEndpoint<IPerformance> {
    return {
      validators: [
        body<{ visibility: Visibility }>({
          visibility: v => v.isIn(Object.values(Visibility))
        })
      ],
      // Only Admin/Owner can update visibility, but editors can update other fields
      // Must also be onboarded to be able to change visibility of a performance
      authStrategy: AuthStrat.runner(
        {
          hid: IdFinderStrat.findHostIdFromPerformanceId
        },
        AuthStrat.and(
          AuthStrat.hostIsOnboarded(m => m.hid),
          AuthStrat.hasHostPermission(HostPermission.Admin, m => m.hid)
        )
      ),
      controller: async req => {
        const perf = await getCheck(Performance.findOne({ _id: req.params.pid }));

        console.log("HEYYYYYYY")

        perf.visibility = req.body.visibility;
        return (await perf.save()).toFull();
      }
    };
  }

  updatePerformance(): IControllerEndpoint<IPerformance> {
    return {
      validators: [],
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Editor),
      controller: async req => {
        const perf = await getCheck(Performance.findOne({ _id: req.params.pid }));
        await perf.update({
          name: req.body.name,
          price: req.body.price,
          description: req.body.description
        });

        return perf.toFull();
      }
    };
  }

  purchase(): IControllerEndpoint<void> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async req => {
        const user = await getCheck(User.findOne({ _id: req.session.user._id }));
        const perf = await getCheck(Performance.findOne({ _id: req.params.pid }, { relations: ['host_info'] }));

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
      // By getting the hostId from the performanceId & then checking if the user has the host
      // permission, there is an implicit intersection, because the UHI will not be returned
      // if the user is not part of the host in which the performance belongs to
      authStrategy: AuthStrat.runner(
        {
          hid: IdFinderStrat.findHostIdFromPerformanceId
        },
        AuthStrat.hasHostPermission(HostPermission.Admin, m => m.hid)
      ),
      controller: async req => {
        const perf = await getCheck(Performance.findOne({ _id: req.params.pid }));
        await perf.remove();
      }
    };
  }
}
