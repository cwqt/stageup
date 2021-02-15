import { BaseController, IControllerEndpoint } from '../common/controller';
import AuthStrat from '../common/authorisation';
import { getCheck } from '../common/errors';
import { Host } from '../models/hosts/host.model';
import { IHost, Environment, HostInviteState, HostPermission } from '@core/interfaces';
import { HostInvitation } from '../models/hosts/host-invitation.model';
import { UserHostInfo } from '../models/hosts/user-host-info.model';

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
      controller: async () => {
        // Clear Influx, Redis, session store & Postgres
        if (this.dc.influx) {
          await this.dc.influx.query('DROP SERIES FROM /.*/');
        }

        if (this.dc.redis) {
          await new Promise(resolve => this.dc.redis.flushdb(resolve));
        }

        if (this.dc.session_store) {
          await new Promise(resolve => {
            this.dc.session_store.clear(resolve);
          });
        }

        await this.ORM.synchronize(true); // https://github.com/nestjs/nest/issues/409
      }
    };
  }

  // For purposes of testing...
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
}
