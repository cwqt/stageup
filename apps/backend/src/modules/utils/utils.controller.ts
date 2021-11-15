import { Configuration } from '@backend/common/configuration.entity';
import Env from '@backend/env';
import { Seeder } from '@backend/seeder';
import {
  Asset,
  EventBus,
  EVENT_BUS_PROVIDER,
  getCheck,
  Host,
  HostAnalytics,
  HostInvitation,
  IControllerEndpoint,
  LiveStreamAsset,
  ModuleController,
  PasswordReset,
  Performance,
  PerformanceAnalytics,
  POSTGRES_PROVIDER,
  Provider,
  STRIPE_PROVIDER,
  transact,
  User,
  UserHostInfo
} from '@core/api';
import { timestamp } from '@core/helpers';
import {
  Environment,
  HostInviteState,
  HostPermission,
  IDynamicFrontendEnvironment,
  IHost,
  LiveStreamState
} from '@core/interfaces';
import Stripe from 'stripe';
import { Inject, Service } from 'typedi';
import { Connection } from 'typeorm';
import AuthStrat from '../../common/authorisation';

@Service()
export class UtilityController extends ModuleController {
  constructor(
    @Inject(EVENT_BUS_PROVIDER) private bus: EventBus,
    @Inject(STRIPE_PROVIDER) private stripe: Stripe,
    @Inject(POSTGRES_PROVIDER) private pg: Connection
  ) {
    super();
  }

  logFrontendMessage: IControllerEndpoint<void> = {
    authorisation: AuthStrat.none,
    controller: async req => {
      // FUTURE Hook up frontend logging messages to some database for user error logging
    }
  };

  seed: IControllerEndpoint<any> = {
    authorisation: AuthStrat.or(AuthStrat.isEnv(Environment.Development), AuthStrat.isEnv(Environment.Development)),
    controller: async req => {
      const configuration = (await Configuration.findOne({})) || new Configuration();
      await configuration.setup();

      await new Seeder(this.stripe).run();

      // seeder will wipe config momentarily, but stored in memory & will be saved again
      configuration.is_seeded = true;
      await configuration.save();
      return configuration;
    }
  };

  ping: IControllerEndpoint<string> = {
    authorisation: AuthStrat.none,
    controller: async () => {
      return 'Pong!';
    }
  };

  // Frontend Docker image is built once, but used for both Staging & Production
  // however there are some environment variables that need to be supplied
  // distinct to each environment, these are requested at run time from the API
  readFrontendEnvironment: IControllerEndpoint<IDynamicFrontendEnvironment> = {
    authorisation: AuthStrat.none,
    controller: async req => ({
      frontend_url: Env.FRONTEND.URL,
      stripe_public_key: Env.STRIPE.PUBLIC_KEY,
      environment: Env.ENVIRONMENT,
      mux_env_key: Env.MUX.DATA_ENV_KEY,
      google_auth_app_id: Env.SOCIAL_AUTH.GOOGLE,
      facebook_auth_app_id: Env.SOCIAL_AUTH.FACEBOOK
    })
  };

  stats: IControllerEndpoint<any> = {
    authorisation: AuthStrat.not(AuthStrat.isEnv(Environment.Production)),
    controller: async () => {
      const config = await Configuration.findOne({});

      return {
        is_seeded: config.is_seeded
      };
    }
  };

  dropAllData: IControllerEndpoint<void> = {
    authorisation: AuthStrat.not(AuthStrat.isEnv(Environment.Production)),
    controller: async req => {
      // await DataClient.drop(providers);
      await this.pg.dropDatabase();
      await this.pg.synchronize();
    }
  };

  /**
   * @description For purposes of testing, accept the invite without having to click a link from an email
   * */
  acceptHostInvite: IControllerEndpoint<void> = {
    authorisation: AuthStrat.not(AuthStrat.isEnv(Environment.Production)),
    controller: async req => {
      const userId = req.params.uid;
      const invite = await HostInvitation.findOne({
        relations: ['invitee'],
        where: {
          invitee: {
            _id: userId
          }
        }
      });

      const uhi = await UserHostInfo.findOne({
        relations: ['user'],
        where: {
          user: {
            _id: userId
          }
        }
      });

      await transact(async txc => {
        invite.state = HostInviteState.Accepted;
        uhi.permissions = HostPermission.Member;
        await Promise.all([txc.save(invite), txc.save(uhi)]);
      });
    }
  };

  verifyHost: IControllerEndpoint<IHost> = {
    authorisation: AuthStrat.not(AuthStrat.isEnv(Environment.Production)),
    controller: async req => {
      const host = await getCheck(Host.findOne({ _id: req.params.hid }));
      host.is_onboarded = true;
      await host.save();
      return host.toFull();
    }
  };

  // http://localhost:3000/utils/assets/yNL3wrYodJH/state?value=video.live_stream.connected
  setPerformanceStreamState: IControllerEndpoint<void> = {
    authorisation: AuthStrat.not(AuthStrat.isEnv(Environment.Production)),
    controller: async req => {
      const asset = await getCheck(LiveStreamAsset.findOne({ _id: req.params.aid }));
      asset.meta.state = req.query.value as LiveStreamState;
      await asset.save();

      this.bus.publish(
        'live_stream.state_changed',
        {
          asset_id: req.params.aid,
          state: req.query.value as LiveStreamState
        },
        req.locale
      );
    }
  };

  sendTestEmail: IControllerEndpoint<void> = {
    authorisation: AuthStrat.not(AuthStrat.isEnv(Environment.Production)),
    controller: async req => {
      const user = await User.findOne();
      this.bus.publish('test.send_email', { user_id: user._id }, req.locale);
    }
  };

  readAssets: IControllerEndpoint<void> = {
    authorisation: AuthStrat.none,
    controller: async req => {
      const assets = await Asset.find({});
    }
  };

  readForgottenPasswordOTP: IControllerEndpoint<string> = {
    authorisation: AuthStrat.not(AuthStrat.isEnv(Environment.Production)),
    controller: async req => {
      const user = await User.findOne(req.params.uid);
      const passwordReset = await PasswordReset.findOne({relations: ['user'], where: {user: { _id: user._id}}});
      return passwordReset.otp;
    }
  };

  getHostInvitationId: IControllerEndpoint<string> = {
    authorisation: AuthStrat.not(AuthStrat.isEnv(Environment.Production)),
    controller: async req => {
      const invitee = await User.findOne(req.params.iid);
      const host = await Host.findOne(req.params.hid);
      const hostInvitation = await HostInvitation.findOne(
        { 
          relations: ['host', 'invitee'],
          where: {
            invitee: { _id: invitee._id},
            host: { _id: host._id}
          }
        }
      );
      return hostInvitation._id;
    }
  };

  addPerformanceAnalytics: IControllerEndpoint<void> = {
    authorisation: AuthStrat.not(AuthStrat.isEnv(Environment.Production)),
    controller: async req => {
      const performance = await Performance.findOne(req.params.pid)
     
      const analytics = new PerformanceAnalytics(performance);
      // For now, add analytics with some dummy data so that we can test the READING of analytics.
      // TODO: Make more realistic insertion that better resembles the current system (inside a job, and using actual values on things like ticket sales etc.)
      analytics.collection_started_at = timestamp();
      analytics.period_ended_at = timestamp();
      analytics.period_started_at = analytics.period_ended_at - 604800; // one week
      analytics.collection_ended_at = timestamp();
      analytics.metrics = {
          total_ticket_sales: 50,
          total_revenue: 500,
          trailer_views: 100,
          performance_views: 42,
          average_watch_percentage: 0
        }
      await analytics.save()
    }
  };

  addHostAnalytics: IControllerEndpoint<void> = {
    authorisation: AuthStrat.not(AuthStrat.isEnv(Environment.Production)),
    controller: async req => {
      const host = await Host.findOne(req.params.hid);
      const analytics = new HostAnalytics(host);
      // For now, add analytics with some dummy data so that we can test the READING of analytics.
      // TODO: Make more realistic insertion that better resembles the current system
      analytics.collection_started_at = timestamp();
      analytics.period_ended_at = timestamp();
      analytics.period_started_at = analytics.period_ended_at - 604800; // one week
      analytics.collection_ended_at = timestamp();
      analytics.metrics = { performances_created: 10 }
      await analytics.save()
    }
  }
}
