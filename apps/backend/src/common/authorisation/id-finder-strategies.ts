import { IdFinderStrategy, PatronTier, Performance, Ticket } from '@core/api';

const findUserIdFromSession: IdFinderStrategy = async req => {
  return req.session.user?._id;
};

const findHostIdFromPerformanceId: IdFinderStrategy = async req => {
  const performanceId = req.params.pid;
  const performance = await Performance.findOne({
    relations: ['host'],
    where: {
      _id: performanceId
    },
    select: {
      _id: true,
      host: {
        _id: true
      }
    }
  });

  return performance?.host?._id;
};

const findHostIdFromPatronTierId: IdFinderStrategy = async req => {
  const tierId = req.params.tid;
  const tier = await PatronTier.findOne({ where: { _id: tierId } });
  return tier?.host__id;
};

export default {
  findUserIdFromSession,
  findHostIdFromPerformanceId,
  findHostIdFromPatronTierId
};
