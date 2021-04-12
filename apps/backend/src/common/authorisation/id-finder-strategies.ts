import { IdFinderStrategy, Performance, Ticket } from '@core/shared/api';

const findUserIdFromSession: IdFinderStrategy = async (req, pm) => {
  return req.session.user?._id;
};

const findHostIdFromPerformanceId: IdFinderStrategy = async (req, pm) => {
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

export default {
  findUserIdFromSession,
  findHostIdFromPerformanceId
};
