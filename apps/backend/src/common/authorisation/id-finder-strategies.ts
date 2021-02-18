import { NUUID } from '@core/interfaces';
import { Request } from 'express';
import { FindOptions } from 'typeorm';
import { Performance } from '../../models/performances/performance.model';
import { DataClient } from '../data';

export type IdFinderStrategy = (req: Request, dc: DataClient) => Promise<NUUID | null>;

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
