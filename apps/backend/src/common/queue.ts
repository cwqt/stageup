import Axios from 'axios';
import { IJob } from '@core/interfaces';
import Env from '../env';
import { log } from './logger';

const enqueue = (job: IJob) => {
  return Axios.post(`${Env.QUEUE_URL}/jobs`, job).catch(e => log.error(`Queuing job ${job.type} failed`, e.message));
};

export default { enqueue };
