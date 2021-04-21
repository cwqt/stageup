import {
  HostPermission,
  IEnvelopedData,
  IHost,
  IUser,
  IUserHostInfo,
  IMyself,
  IAddress,
  IUserPrivate,
  Idless,
  ErrCode,
  HTTP,
  Environment,
  IUserStub,
  pick,
  IPerformanceStub,
  IUserInvoice
} from '@core/interfaces';
import {
  IControllerEndpoint,
  BaseController,
  User,
  Host,
  Address,
  Validators,
  body,
  params as parameters,
  ErrorHandler,
  FormErrorResponse,
  getCheck,
  Auth,
  UserHostInfo,
  Invoice,
  Ticket,
  AccessToken
} from '@core/shared/api';

import Email = require('../common/email');
import Env from '../env';
import AuthStrat from '../common/authorisation';

import { EntityManager } from 'typeorm';
import { BackendProviderMap } from '..';
import idFinderStrategies from '../common/authorisation/id-finder-strategies';

export default class MyselfController extends BaseController<BackendProviderMap> {
  readMyself(): IControllerEndpoint<IMyself> {
    return {
      authStrategy: AuthStrat.isLoggedIn,
      controller: async req => {
        const user = await getCheck(User.findOne({ _id: req.session.user._id }));
        const host: Host = await Host.findOne({
          relations: {
            members_info: {
              user: true
            }
          },
          where: {
            members_info: {
              user: {
                _id: user._id
              }
            }
          }
        });

        return {
          user: { ...user.toFull(), email_address: user.email_address },
          host: host?.toFull(),
          host_info: host ? host.members_info.find(uhi => uhi.user._id === user._id)?.toFull() : null
        };
      }
    };
  }

  updatePreferredLandingPage(): IControllerEndpoint<IUserHostInfo> {
    return {
      validators: [
        body<Pick<IUserHostInfo, 'prefers_dashboard_landing'>>({
          prefers_dashboard_landing: v => v.isBoolean()
        })
      ],
      authStrategy: AuthStrat.isMemberOfAnyHost,
      controller: async req => {
        const uhi = await getCheck(
          UserHostInfo.findOne({
            relations: ['user'],
            where: {
              user: {
                _id: req.session.user._id
              }
            },
            select: {
              user: {
                _id: true
              }
            }
          })
        );

        uhi.prefers_dashboard_landing = req.body.prefers_dashboard_landing;
        await uhi.save();
        return uhi.toFull();
      }
    };
  }

  readMyPurchasedPerformances(): IControllerEndpoint<IEnvelopedData<IPerformanceStub[]>> {
    return {
      authStrategy: AuthStrat.isLoggedIn,
      controller: async req => {
        return await AccessToken.createQueryBuilder('token')
          .where('token.user__id = :uid', { uid: req.session.user._id })
          .leftJoinAndSelect('token.performance', 'performance')
          .andWhere('LOWER(performance.name) LIKE :name', {
            name: req.query.name ? `%${(req.query.name as string).toLowerCase()}%` : '%'
          })
          .leftJoinAndSelect('performance.host', 'host')
          .innerJoinAndSelect('performance.stream', 'stream')
          .paginate(t => t.performance.toStub());
      }
    };
  }

  readInvoices(): IControllerEndpoint<IEnvelopedData<IUserInvoice[]>> {
    return {
      authStrategy: AuthStrat.isLoggedIn,
      controller: async req => {
        return await this.ORM.createQueryBuilder(Invoice, 'invoice')
          .where('invoice.user__id = :user_id', { user_id: req.session.user._id })
          .leftJoinAndSelect('invoice.ticket', 'ticket')
          .leftJoinAndSelect('ticket.performance', 'performance')
          .filter({
            performance_name: { subject: 'performance.name' },
            ticket_type: { subject: 'ticket.type' },
            purchased_at: { subject: 'invoice.purchased_at' },
            payment_status: { subject: 'invoice.status' },
            amount: { subject: 'invoice.amount', transformer: v => parseInt(v as string) }
          })
          .sort({
            performance_name: 'performance.name',
            amount: 'invoice.amount',
            purchased_at: 'invoice.purchased_at'
          })
          .innerJoinAndSelect('performance.stream', 'stream')
          .paginate(i => i.toUserInvoice());
      }
    };
  }
}
