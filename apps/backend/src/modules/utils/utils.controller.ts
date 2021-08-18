import { Configuration } from '@backend/common/configuration.entity';
import Env from '@backend/env';
import { Seeder } from '@backend/seeder';
import {
  Asset,
  EventBus,
  EVENT_BUS_PROVIDER,
  getCheck,
  Host,
  HostInvitation,
  IControllerEndpoint,
  LiveStreamAsset,
  ModuleController,
  POSTGRES_PROVIDER,
  Provider,
  STRIPE_PROVIDER,
  transact,
  User,
  UserHostInfo
} from '@core/api';
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
      mux_env_key: Env.MUX.DATA_ENV_KEY
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
}