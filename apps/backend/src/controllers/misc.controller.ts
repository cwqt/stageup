import { Environment, HostInviteState, HostPermission, IHost, LiveStreamState } from '@core/interfaces';
import {
  BaseController,
  DataClient,
  getCheck,
  Host,
  HostInvitation,
  IControllerEndpoint,
  TopicType,
  UserHostInfo
} from '@core/api';
import { BackendProviderMap } from '..';
import AuthStrat from '../common/authorisation';
import { sendEmail } from '../common/email';
import { log } from '../common/logger';
import Env from '../env';

export default class MiscController extends BaseController<BackendProviderMap> {
  logFrontendMessage(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.none,
      controller: async req => {
        // TODO: hook up frontend logging messages to some database for user error logging
      }
    };
  }

  ping(): IControllerEndpoint<string> {
    return {
      authStrategy: AuthStrat.not(AuthStrat.isEnv(Environment.Production)),
      controller: async () => {
        return 'Pong!';
      }
    };
  }

  dropAllData(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.not(AuthStrat.isEnv(Environment.Production)),
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
      authStrategy: AuthStrat.not(AuthStrat.isEnv(Environment.Production)),
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
      authStrategy: AuthStrat.not(AuthStrat.isEnv(Environment.Production)),
      controller: async req => {
        const host = await getCheck(Host.findOne({ _id: req.params.hid }));
        host.is_onboarded = true;
        await host.save();
        return host.toFull();
      }
    };
  }

  // http://localhost:3000/utils/performances/yNL3wrYodJH/state?value=video.live_stream.connected
  setPerformanceStreamState(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.not(AuthStrat.isEnv(Environment.Production)),
      controller: async req => {
        this.providers.pubsub.publish(TopicType.StreamStateChanged, {
          performance_id: req.params.pid,
          state: req.query.value as LiveStreamState
        });
      }
    };
  }

  testSendGrid(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.not(AuthStrat.isEnv(Environment.Production)),
      controller: async req => {
        sendEmail({
          from: Env.EMAIL_ADDRESS,
          to: 'm@cass.si',
          subject: `This is a test email`,
          html: `<p>This is a test email</p>`
        });
      }
    };
  }
}
