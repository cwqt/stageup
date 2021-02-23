import { Auth, BaseController, IControllerEndpoint } from '@core/shared/api';
import AuthStrat from '../common/authorisation';
import { getCheck } from '@core/shared/api';
import { Host } from '../models/hosts/host.model';
import { IHost, Environment, HostInviteState, HostPermission, HTTP, ErrCode } from '@core/interfaces';
import { HostInvitation } from '../models/hosts/host-invitation.model';
import { UserHostInfo } from '../models/hosts/user-host-info.model';
import { Provider } from '@core/shared/api';
import { sendEmail } from '../common/email';
import Env from '../env';

export default class MiscController extends BaseController {
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
      controller: async (req, dc) => {
        await Provider.drop(dc.providers);
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

  testSendGrid():IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.not(AuthStrat.isEnv(Environment.Production)),
      controller: async req => {
        sendEmail({
          from: Env.EMAIL_ADDRESS,
          to: "m@cass.si",
          subject: `This is a test email`,
          html: `<p>This is a test email</p>`      
        })
      }
    }
  }
}
