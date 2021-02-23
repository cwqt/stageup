import { IdFinderStrategy } from '@core/shared/api';
import { Performance } from '../../models/performances/performance.model';


const findUserIdFromSession: IdFinderStrategy = async (req, dc) => {
  return req.session.user?._id;
};

const findHostIdFromPerformanceId: IdFinderStrategy = async (req, dc) => {
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
