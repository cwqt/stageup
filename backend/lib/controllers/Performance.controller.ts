import {
  IHost,
  IPerformance,
  IPerformanceHostInfo,
  IPerformanceStub,
  IPerformanceUserInfo,
  IUser,
} from '@eventi/interfaces';
import { Request } from 'express';
import { User } from '../models/User.model';
import { DataClient } from '../common/data';
import { Performance } from '../models/Performance.model';
import { Host } from '../models/Host.model';
import { ErrorHandler } from '../common/errors';
import { HTTP } from '../common/http';
import { validate } from '../common/validate';
import { body } from 'express-validator';
import { PerformanceHostInfo } from '../models/PerformanceHostInfo.model';
import { Purchase } from '../models/Purchase.model';
import { SigningKey } from '../models/SigningKey.model';

export const validators = {
  createPerformance: validate([body('name').not().isEmpty().withMessage('Performance must have a title!')]),
};

export const createPerformance = async (req: Request, dc: DataClient): Promise<IPerformance> => {
  const user = await User
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.host', 'host')
    .getOne();

  if (!user.host) throw new ErrorHandler(HTTP.BadRequest, "You're not authorised to create performances.");

  const performance = await new Performance({
      name: req.body.name,
      description: req.body.description ?? '',
      price: req.body.price,
      currency: req.body.currency,
    },
    user
  ).setup(dc);

  return performance.toFull();
};

export const getPerformances = async (req: Request): Promise<IPerformanceStub[]> => {
  const performances = await Performance.find({ take: 10, relations: ['host'] });
  return performances.map((p: Performance) => p.toStub());
};

export const getPerformance = async (req: Request, dc: DataClient): Promise<IPerformance> => {
  const performance = await Performance.findOne(
    { _id: parseInt(req.params.pid) },
    { relations: ['host', 'host_info'] }
  );

  // see if current user has access/bought the performance
  if (req.session?.user._id) {
    let memberOfHost: boolean = false;
    let token: string;
    let previousPurchase: Purchase | null;

    // check if user is part of host that created performance
    const user = await User.findOne({ _id: req.session.user._id }, { relations: ['host'] });
    if (user.host._id == performance.host._id) memberOfHost = true;

    // check if user has purchased the performance
    if (!memberOfHost) {
      previousPurchase = await Purchase.findOne({
        relations: ['user', 'performance'],
        where: {
          user: { _id: user._id },
          performance: { _id: performance._id },
        },
      });

      token = previousPurchase.token;
    }

    // neither member of host, nor has a purchased token
    if (!(memberOfHost || token))
      throw new ErrorHandler(HTTP.Unauthorised, "You don't have access to watch this performance");

    // sign on the fly for a member of the host
    console.log(performance)
    if (memberOfHost) token = performance.host_info.signing_key.signToken(performance);

    return {
      ...performance.toFull(),
      __user_access: {
        signed_token: token,
        purchase_id: previousPurchase?._id,
        expires: false,
      },
    };
  }

  return performance;
};

export const getPerformanceHostInfo = async (req: Request, dc: DataClient): Promise<IPerformanceHostInfo> => {
  const hostInfoId: string | null = ((await dc.torm
    .createQueryBuilder()
    .select('performance.host_info')
    .from(Performance, 'performance')
    .whereInIds(req.params.pid)
    .execute()) || [])[0]?.hostInfo_id;

  if (!hostInfoId) throw new ErrorHandler(HTTP.BadRequest, 'No Host Info for this Performance');

  const performanceHostInfo = await PerformanceHostInfo.createQueryBuilder('phi')
    .whereInIds(parseInt(hostInfoId))
    .leftJoinAndSelect('phi.signing_key', 'sk')
    .getOne();

  return performanceHostInfo as IPerformanceHostInfo;
};

export const purchase = async (req: Request, dc: DataClient): Promise<void> => {
  const user = await User.findOne({ _id: req.session.user._id });
  const perf = await Performance.findOne({ _id: parseInt(req.params.pid) }, { relations: ['host_info'] });

  //check user hasn't already purchased performance
  const previousPurchase = await Purchase.findOne({
    relations: ['user', 'performance'],
    where: {
      user: { _id: user._id },
      performance: { _id: perf._id },
    },
  });

  if (previousPurchase) throw new ErrorHandler(HTTP.BadRequest, 'Already purchased this performance');

  const purchase = new Purchase(user, perf);
  purchase.token = perf.host_info.signing_key.signToken(perf);

  await dc.torm.manager.save(purchase);
};
