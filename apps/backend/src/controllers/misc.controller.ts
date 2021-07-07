import { Environment, HostInviteState, HostPermission, IHost, LiveStreamState } from '@core/interfaces';
import {
  Asset,
  BaseController,
  DataClient,
  getCheck,
  Host,
  HostInvitation,
  IControllerEndpoint,
  LiveStreamAsset,
  User,
  UserHostInfo
} from '@core/api';
import { BackendProviderMap } from '@backend/common/providers';
import AuthStrat from '../common/authorisation';
import Env from '../env';

export default class MiscController extends BaseController<BackendProviderMap> {
  logFrontendMessage(): IControllerEndpoint<void> {
    return {
      authorisation: AuthStrat.none,
      controller: async req => {
        // FUTURE Hook up frontend logging messages to some database for user error logging
      }
    };
  }

  ping(): IControllerEndpoint<string> {
    return {
      authorisation: AuthStrat.not(AuthStrat.isEnv(Environment.Production)),
      controller: async () => {
        return 'Pong!';
      }
    };
  }

  dropAllData(): IControllerEndpoint<void> {
    return {
      authorisation: AuthStrat.not(AuthStrat.isEnv(Environment.Production)),
      controller: async req => {
        await DataClient.drop(this.providers);
      }
    };
  }

  /**
   * @description For purposes of testing, accept the invite without having to click a link from an email
   * */
  acceptHostInvite(): IControllerEndpoint<void> {
    return {
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

        await this.ORM.transaction(async txc => {
          invite.state = HostInviteState.Accepted;
          uhi.permissions = HostPermission.Member;
          await Promise.all([txc.save(invite), txc.save(uhi)]);
        });
      }
    };
  }

  verifyHost(): IControllerEndpoint<IHost> {
    return {
      authorisation: AuthStrat.not(AuthStrat.isEnv(Environment.Production)),
      controller: async req => {
        const host = await getCheck(Host.findOne({ _id: req.params.hid }));
        host.is_onboarded = true;
        await host.save();
        return host.toFull();
      }
    };
  }

  // http://localhost:3000/utils/assets/yNL3wrYodJH/state?value=video.live_stream.connected
  setPerformanceStreamState(): IControllerEndpoint<void> {
    return {
      authorisation: AuthStrat.not(AuthStrat.isEnv(Environment.Production)),
      controller: async req => {
        const asset = await getCheck(LiveStreamAsset.findOne({ _id: req.params.aid }));
        asset.meta.state = req.query.value as LiveStreamState;
        await asset.save();

        this.providers.bus.publish(
          'live_stream.state_changed',
          {
            asset_id: req.params.aid,
            state: req.query.value as LiveStreamState
          },
          req.locale
        );
      }
    };
  }

  sendTestEmail(): IControllerEndpoint<void> {
    return {
      authorisation: AuthStrat.not(AuthStrat.isEnv(Environment.Production)),
      controller: async req => {
        const user = await User.findOne();
        this.providers.bus.publish('test.send_email', { user_id: user._id }, req.locale);
      }
    };
  }

  readAssets(): IControllerEndpoint<void> {
    return {
      authorisation: AuthStrat.none,
      controller: async req => {
        const assets = await Asset.find({});
        console.log(assets);
      }
    };
  }
}
