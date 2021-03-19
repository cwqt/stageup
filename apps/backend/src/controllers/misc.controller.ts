import AuthStrat from '../common/authorisation';
import {
  Provider,
  UserHostInfo,
  Host,
  getCheck,
  HostInvitation,
  BaseController,
  IControllerEndpoint,
  DataClient
} from '@core/shared/api';
import { IHost, Environment, HostInviteState, HostPermission } from '@core/interfaces';
import { sendEmail } from '../common/email';
import Env from '../env';
import { BackendProviderMap } from '..';

export default class MiscController extends BaseController<BackendProviderMap> {
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
